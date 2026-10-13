package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class AiGeneration implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long planId;
    private String inputType;
    private String inputContent;
    private String modelName;
    private String prompt;
    private String outputJson;
    private String status;
    private String errorMessage;
    /** 发起生成的用户ID（NULL=存量/匿名） */
    private Long userId;
    private Date createdAt;
}
