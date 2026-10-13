package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 图片导入识图记录（Phase 14）。
 */
@Data
public class ImageImport implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    /** 上传用户ID */
    private Long userId;
    /** 关联的 ai_generation 记录ID */
    private Long aiGenerationId;
    /** 确认生成后关联的行程ID */
    private Long planId;
    /** 识图使用的模型ID（实际使用值） */
    private String modelName;
    /** 上传图片张数 */
    private Integer imageCount;
    /** 已存储图片相对路径，JSON 数组字符串 */
    private String imagePaths;
    /** AI 识别出的行程原始 JSON */
    private String recognizedJson;
    /** PENDING/RECOGNIZED/CONFIRMED/FAILED */
    private String status;
    private String errorMessage;
    private Date createdAt;
}
