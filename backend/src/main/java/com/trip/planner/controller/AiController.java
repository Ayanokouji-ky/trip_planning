package com.trip.planner.controller;

import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.request.AiGenerateRequest;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.service.AiGenerateService;
import com.trip.planner.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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
    public ApiResult<AiItineraryDto> generateRaw(@RequestBody String requirement) {
        AiItineraryDto itinerary = aiService.generateItinerary(requirement).getItinerary();
        return ApiResult.ok(itinerary);
    }

    /**
     * Phase 5：端到端 AI 行程生成（AI → geocode → route → 持久化），返回完整行程详情。
     */
    @PostMapping("/generate")
    public ApiResult<PlanDetailResponse> generate(@Validated @RequestBody AiGenerateRequest request) {
        return ApiResult.ok(aiGenerateService.generate(request));
    }
}
