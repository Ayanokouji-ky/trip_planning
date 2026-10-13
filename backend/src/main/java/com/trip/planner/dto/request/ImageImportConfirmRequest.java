package com.trip.planner.dto.request;

import com.trip.planner.dto.ai.AiItineraryDto;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * 图片识图确认请求（Phase 14）：用户确认后将识别结果（可含人工编辑）持久化为行程。
 */
@Data
public class ImageImportConfirmRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 识图记录ID（POST /api/ai/image-import 返回） */
    @NotNull(message = "importId 不能为空")
    private Long importId;

    /** 可选：自定义行程标题，缺省时按识别结果自动生成 */
    private String title;

    /** 用户确认/编辑后的行程（为空则使用后端已存储的识别结果） */
    private AiItineraryDto itinerary;
}
