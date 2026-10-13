package com.trip.planner.service;

import com.trip.planner.dto.ai.AiGenerateResult;

public interface AiService {

    /**
     * 调用 AI 生成行程（使用默认模型），返回解析后的结构化数据及 ai_generation 记录ID。
     * 同时向 ai_generation 表写入调用记录（PENDING -> SUCCESS/FAILED）。
     */
    AiGenerateResult generateItinerary(String userRequirement);

    /**
     * 调用 AI 生成行程（指定模型），返回解析后的结构化数据及 ai_generation 记录ID。
     * model 为 null/空时使用默认文本模型；不在白名单中时抛 BusinessException(400)；
     * 模型不可用时降级到默认模型，结果中 degraded=true。
     *
     * @param userRequirement 用户需求文本
     * @param model           指定模型 ID（可为 null）
     */
    AiGenerateResult generateItinerary(String userRequirement, String model);
}
