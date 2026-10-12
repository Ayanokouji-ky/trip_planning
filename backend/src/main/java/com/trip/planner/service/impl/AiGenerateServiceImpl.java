package com.trip.planner.service.impl;

import com.trip.planner.dto.ai.AiGenerateResult;
import com.trip.planner.dto.request.AiGenerateRequest;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.TravelPlan;
import com.trip.planner.mapper.AiGenerationMapper;
import com.trip.planner.service.AiGenerateService;
import com.trip.planner.service.AiService;
import com.trip.planner.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * AI 生成编排服务。本身不开事务：
 * - AI 调用阶段由 ArkAiServiceImpl 独立写 ai_generation（FAILED 记录不因后续流程回滚）；
 * - 持久化阶段由 PlanService.createFromAi 单事务完成。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiGenerateServiceImpl implements AiGenerateService {

    private final AiService aiService;
    private final PlanService planService;
    private final AiGenerationMapper aiGenerationMapper;

    @Override
    public PlanDetailResponse generate(AiGenerateRequest request) {
        // 1. AI 调用（事务外；失败时 ArkAiServiceImpl 已写 FAILED 并抛 AiGenerationException）
        AiGenerateResult result = aiService.generateItinerary(request.getRequirement());

        // 2. 单事务持久化（geocode/route 单点失败不中断）
        TravelPlan plan = planService.createFromAi(result.getItinerary(), request.getTitle());

        // 3. 关联 ai_generation -> plan
        aiGenerationMapper.updateStatus(result.getGenerationId(), "SUCCESS", null, plan.getId());
        log.info("AI generate orchestration done: generationId={}, planId={}",
                result.getGenerationId(), plan.getId());

        // 4. 返回完整详情
        return planService.getDetail(plan.getId());
    }
}
