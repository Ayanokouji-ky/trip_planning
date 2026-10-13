package com.trip.planner.controller;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.constant.ModelConstants;
import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.request.AiGenerateRequest;
import com.trip.planner.dto.response.AiGenerateResponse;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.ModelInfo;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.AiGenerateService;
import com.trip.planner.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AiGenerateService aiGenerateService;

    /**
     * Phase 3 验证用最小端点：调用 AI 生成行程并返回解析结果（不持久化）。
     */
    @PostMapping("/generate-raw")
    public ApiResult<AiItineraryDto> generateRaw(@RequestBody String requirement,
                                                  @CurrentUser UserContext user) {
        // 仅校验登录态，AI 调用本身不依赖 userId
        AiItineraryDto itinerary = aiService.generateItinerary(requirement).getItinerary();
        return ApiResult.ok(itinerary);
    }

    /**
     * Phase 5：端到端 AI 行程生成（AI → geocode → route → 持久化），返回完整行程详情 + 模型降级信息。
     */
    @PostMapping("/generate")
    public ApiResult<AiGenerateResponse> generate(@Validated @RequestBody AiGenerateRequest request,
                                                  @CurrentUser UserContext user) {
        return ApiResult.ok(aiGenerateService.generate(request, user.getId()));
    }

    /**
     * Phase 13：获取可用模型列表。
     * @param type text=文本模型, image=识图模型，缺省返回文本模型
     */
    @GetMapping("/models")
    public ApiResult<List<ModelInfo>> models(@RequestParam(name = "type", defaultValue = "text") String type) {
        List<ModelInfo> models = "image".equalsIgnoreCase(type)
                ? ModelConstants.IMAGE_MODELS
                : ModelConstants.TEXT_MODELS;
        return ApiResult.ok(models);
    }

    /**
     * Phase 18：节点 AI 智能填充——只输入地点名称，AI 生成其余表单字段（全部可编辑）。
     */
    @PostMapping("/enrich-node")
    public ApiResult<com.trip.planner.dto.response.NodeEnrichResponse> enrichNode(
            @Validated @RequestBody com.trip.planner.dto.request.NodeEnrichRequest request,
            @CurrentUser UserContext user) {
        // 仅校验登录态，AI 填充本身不依赖 userId
        return ApiResult.ok(aiService.enrichNode(request.getName(), request.getCity(), request.getModel()));
    }
}
