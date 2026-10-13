package com.trip.planner.service;

import com.trip.planner.dto.request.AiGenerateRequest;
import com.trip.planner.dto.response.AiGenerateResponse;

public interface AiGenerateService {

    /**
     * 端到端 AI 行程生成编排：
     * prompt → AI 调用（ai_generation PENDING/SUCCESS/FAILED，非事务记录）
     * → 单事务持久化（plan/days/nodes/routes，geocode/route 单点失败不中断）
     * → 关联 ai_generation.planId → 返回完整行程详情 + 模型降级信息。
     *
     * @param userId 发起生成的用户ID，写入 ai_generation.user_id 和 travel_plan.user_id
     */
    AiGenerateResponse generate(AiGenerateRequest request, Long userId);
}
