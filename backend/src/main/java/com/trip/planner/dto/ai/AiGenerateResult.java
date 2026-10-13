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
    /** 所选模型不可用时是否降级到默认模型 */
    private boolean degraded;
    /** 实际使用的模型 ID */
    private String modelUsed;
}
