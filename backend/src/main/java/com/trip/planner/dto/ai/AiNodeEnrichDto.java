package com.trip.planner.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * 节点 AI 填充的原始 JSON 结构（Phase 18，snake_case 镜像 AI 输出）。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiNodeEnrichDto {

    private String place_type;
    private Integer suggested_duration;
    private String highlight;
    private String description;
    private String open_time;
    private String ticket_info;
    private Double estimated_cost;
}
