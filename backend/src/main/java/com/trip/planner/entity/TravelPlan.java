package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class TravelPlan implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String city;
    private Integer days;
    private String status;
    private String summary;
    /** 归属用户ID（NULL=存量公共数据） */
    private Long userId;
    /** 是否公共行程: 0=私有 1=公共 */
    private Integer isPublic;
    private Date createdAt;
    private Date updatedAt;
}
