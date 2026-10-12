package com.trip.planner.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * AI 生成结果：解析后的行程数据 + ai_generation 记录ID（用于编排后关联 planId）。
 */
@Data
@AllArgsConstructor
public class AiGenerateResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long generationId;
    private AiItineraryDto itinerary;
}
