package com.trip.planner.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * AI 生成接口响应：包含生成的行程详情 + 模型降级信息。
 */
@Data
@AllArgsConstructor
public class AiGenerateResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 生成的行程详情 */
    private PlanDetailResponse plan;
    /** 所选模型不可用时是否降级到默认模型 */
    private boolean degraded;
    /** 实际使用的模型 ID */
    private String modelUsed;
}
