package com.trip.planner.controller;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.dto.request.ImageImportConfirmRequest;
import com.trip.planner.dto.response.AiGenerateResponse;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.ImageImportResponse;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.ImageImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 图片一图流识图接口（Phase 14）。
 */
@Slf4j
@RestController
@RequestMapping("/api/ai/image-import")
@RequiredArgsConstructor
public class ImageImportController {

    private final ImageImportService imageImportService;

    /**
     * 上传图片 → 返回识别的行程预览。
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResult<ImageImportResponse> recognize(@RequestParam("files") MultipartFile[] files,
                                                    @RequestParam(value = "model", required = false) String model,
                                                    @CurrentUser UserContext user) {
        return ApiResult.ok(imageImportService.recognize(files, model, user.getId()));
    }

    /**
     * 用户确认（可含编辑）→ 正式生成行程。
     */
    @PostMapping("/confirm")
    public ApiResult<AiGenerateResponse> confirm(@Validated @RequestBody ImageImportConfirmRequest request,
                                                 @CurrentUser UserContext user) {
        return ApiResult.ok(imageImportService.confirm(request, user.getId()));
    }
}
