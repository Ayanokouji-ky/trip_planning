package com.trip.planner.service;

import com.trip.planner.dto.request.AiGenerateRequest;
import com.trip.planner.dto.response.PlanDetailResponse;

public interface AiGenerateService {

    /**
     * 端到端 AI 行程生成编排：
     * prompt → AI 调用（ai_generation PENDING/SUCCESS/FAILED，非事务记录）
     * → 单事务持久化（plan/days/nodes/routes，geocode/route 单点失败不中断）
     * → 关联 ai_generation.planId → 返回完整行程详情。
     */
    PlanDetailResponse generate(AiGenerateRequest request);
}
