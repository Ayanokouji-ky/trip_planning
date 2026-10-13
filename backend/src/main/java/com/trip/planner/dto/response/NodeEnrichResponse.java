package com.trip.planner.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 节点 AI 智能填充响应（Phase 18）：AI 生成的节点补充字段，全部可编辑。
 * 不确定的字段为 null（宁缺勿错），由用户手动填写。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeEnrichResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /** ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER */
    private String placeType;
    /** 建议游览时长（分钟） */
    private Integer suggestedDuration;
    private String highlight;
    private String description;
    private String openTime;
    private String ticketInfo;
    /** 预估费用（元） */
    private Double estimatedCost;
    /** 本次填充实际使用的模型 ID */
    private String modelUsed;
}
