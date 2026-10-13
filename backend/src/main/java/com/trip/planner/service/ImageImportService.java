package com.trip.planner.service;

import com.trip.planner.dto.request.ImageImportConfirmRequest;
import com.trip.planner.dto.response.AiGenerateResponse;
import com.trip.planner.dto.response.ImageImportResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * 图片一图流识图服务（Phase 14）。
 */
public interface ImageImportService {

    /**
     * 上传图片 → AI 识图 → 返回行程预览（不落库为行程）。
     * 图片存入 uploads/{uuid}.{ext}，写入 image_import 记录（RECOGNIZED）。
     *
     * @param files  上传的图片（jpg/jpeg/png/webp，单张 ≤ 10MB，最多 9 张）
     * @param model  识图模型 ID（可为 null，缺省使用默认识图模型）
     * @param userId 当前用户ID
     */
    ImageImportResponse recognize(MultipartFile[] files, String model, Long userId);

    /**
     * 用户确认识别结果 → 持久化为正式行程（复用 PlanService.createFromAi，单事务）。
     * 行程取请求中（可编辑后的）itinerary；为空时使用后端已存储的识别结果。
     */
    AiGenerateResponse confirm(ImageImportConfirmRequest request, Long userId);
}
