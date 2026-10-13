package com.trip.planner.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trip.planner.config.AppProperties;
import com.trip.planner.dto.ai.AiGenerateResult;
import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.request.ImageImportConfirmRequest;
import com.trip.planner.dto.response.AiGenerateResponse;
import com.trip.planner.dto.response.ImageImportResponse;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.ImageImport;
import com.trip.planner.entity.TravelPlan;
import com.trip.planner.exception.BusinessException;
import com.trip.planner.exception.ResourceNotFoundException;
import com.trip.planner.mapper.ImageImportMapper;
import com.trip.planner.service.AiService;
import com.trip.planner.service.ImageImportService;
import com.trip.planner.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 图片识图服务实现：图片落盘 → base64 data URL → Ark 识图（AiService）→ image_import 记录。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageImportServiceImpl implements ImageImportService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    /** 单张图片最大 10MB */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    /** 单次最多 9 张图片 */
    private static final int MAX_IMAGES = 9;
    private static final Set<String> ALLOWED_EXT =
            new HashSet<>(Arrays.asList("jpg", "jpeg", "png", "webp"));

    private final AppProperties appProperties;
    private final AiService aiService;
    private final PlanService planService;
    private final ImageImportMapper imageImportMapper;

    @Override
    public ImageImportResponse recognize(MultipartFile[] files, String model, Long userId) {
        validate(files);

        Path dir = Paths.get(appProperties.getUpload().getDir()).toAbsolutePath().normalize();
        List<String> storedNames = new ArrayList<>();
        List<String> dataUrls = new ArrayList<>();
        try {
            Files.createDirectories(dir);
            for (MultipartFile file : files) {
                String ext = extOf(file.getOriginalFilename());
                String filename = UUID.randomUUID().toString().replace("-", "") + "." + ext;
                Path target = dir.resolve(filename);
                file.transferTo(target.toFile());
                storedNames.add(filename);
                byte[] bytes = Files.readAllBytes(target);
                dataUrls.add("data:" + mimeOf(ext) + ";base64,"
                        + Base64.getEncoder().encodeToString(bytes));
            }
        } catch (IOException e) {
            log.error("Save uploaded images failed", e);
            throw new BusinessException(400, "图片保存失败: " + e.getMessage());
        }

        // 先写 PENDING 记录，拿到 importId 用于响应与后续 confirm
        ImageImport record = new ImageImport();
        record.setUserId(userId);
        record.setImageCount(files.length);
        record.setImagePaths(toJson(storedNames));
        record.setStatus("PENDING");
        imageImportMapper.insert(record);

        try {
            AiGenerateResult result = aiService.recognizeItineraryFromImages(dataUrls, model);
            String recognizedJson = toJson(result.getItinerary());
            imageImportMapper.updateRecognized(
                    record.getId(), result.getModelUsed(), recognizedJson, result.getGenerationId());
            log.info("Image import recognized: importId={}, userId={}, images={}, model={}, degraded={}",
                    record.getId(), userId, files.length, result.getModelUsed(), result.isDegraded());
            return new ImageImportResponse(record.getId(), result.getItinerary(),
                    result.isDegraded(), result.getModelUsed(), files.length);
        } catch (Exception e) {
            imageImportMapper.updateFailed(record.getId(), truncate(e.getMessage(), 500));
            throw e;
        }
    }

    @Override
    public AiGenerateResponse confirm(ImageImportConfirmRequest request, Long userId) {
        ImageImport record = imageImportMapper.selectById(request.getImportId());
        if (record == null) {
            throw new ResourceNotFoundException("ImageImport", request.getImportId());
        }
        if (record.getUserId() == null || !record.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作他人导入记录");
        }

        // 行程取用户（可编辑后的）提交；为空时回退到后端存储的识别结果
        boolean edited = request.getItinerary() != null;
        AiItineraryDto itinerary = edited ? request.getItinerary() : parseJson(record.getRecognizedJson());
        if (itinerary == null || itinerary.getItinerary() == null || itinerary.getItinerary().isEmpty()) {
            throw new BusinessException(400, "识别结果为空，无法生成行程");
        }

        TravelPlan plan = planService.createFromAi(itinerary, request.getTitle(), userId);
        imageImportMapper.updateConfirm(record.getId(), plan.getId(), edited ? toJson(itinerary) : null);
        log.info("Image import confirmed: importId={}, planId={}, userId={}",
                record.getId(), plan.getId(), userId);

        PlanDetailResponse detail = planService.getDetail(plan.getId(), userId);
        return new AiGenerateResponse(detail, false, record.getModelName());
    }

    // ===== 校验 =====

    private void validate(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new BusinessException(400, "请至少上传一张图片");
        }
        if (files.length > MAX_IMAGES) {
            throw new BusinessException(400, "单次最多上传 " + MAX_IMAGES + " 张图片");
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                throw new BusinessException(400, "存在空文件，请重新选择图片");
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new BusinessException(400, "单张图片请勿超过 10MB");
            }
            String ext = extOf(file.getOriginalFilename());
            if (!ALLOWED_EXT.contains(ext)) {
                throw new BusinessException(400, "仅支持 jpg / png / webp 格式的图片");
            }
        }
    }

    private String extOf(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase() : "";
    }

    private String mimeOf(String ext) {
        if ("jpg".equals(ext) || "jpeg".equals(ext)) {
            return "image/jpeg";
        }
        if ("png".equals(ext)) {
            return "image/png";
        }
        if ("webp".equals(ext)) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private String toJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            throw new BusinessException(400, "识别结果序列化失败: " + e.getMessage());
        }
    }

    private AiItineraryDto parseJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, AiItineraryDto.class);
        } catch (Exception e) {
            log.warn("Parse stored recognizedJson failed: {}", e.getMessage());
            return null;
        }
    }

    private String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() > max ? s.substring(0, max) : s;
    }
}
