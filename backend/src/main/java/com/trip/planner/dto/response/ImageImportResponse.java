package com.trip.planner.dto.response;

import com.trip.planner.dto.ai.AiItineraryDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * 图片识图预览响应（Phase 14）：上传图片后返回 AI 识别出的行程结构 + 模型降级信息。
 */
@Data
@AllArgsConstructor
public class ImageImportResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 识图记录ID（用于后续 confirm） */
    private Long importId;
    /** 识别出的行程结构 */
    private AiItineraryDto itinerary;
    /** 所选识图模型不可用时是否降级到默认模型 */
    private boolean degraded;
    /** 实际使用的识图模型 ID */
    private String modelUsed;
    /** 上传图片张数 */
    private Integer imageCount;
}
