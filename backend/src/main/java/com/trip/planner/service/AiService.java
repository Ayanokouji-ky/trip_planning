package com.trip.planner.service;

import com.trip.planner.dto.ai.AiGenerateResult;

public interface AiService {

    /**
     * 调用 AI 生成行程，返回解析后的结构化数据及 ai_generation 记录ID。
     * 同时向 ai_generation 表写入调用记录（PENDING -> SUCCESS/FAILED）。
     */
    AiGenerateResult generateItinerary(String userRequirement);
}
