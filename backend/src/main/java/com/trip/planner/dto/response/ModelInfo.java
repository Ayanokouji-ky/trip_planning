package com.trip.planner.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * 模型信息 DTO，用于 GET /api/ai/models 返回。
 */
@Data
@AllArgsConstructor
public class ModelInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 模型 ID（传给后端生成接口的 model 参数） */
    private String id;
    /** 展示名称 */
    private String label;
    /** 简短标签：推荐 / 质量优先 / 速度快 / 国产 / GA 稳定 */
    private String tag;
    /** 描述说明 */
    private String description;
}
