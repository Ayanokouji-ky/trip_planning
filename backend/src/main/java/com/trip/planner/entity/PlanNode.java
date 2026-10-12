package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class PlanNode implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long planId;
    private Long dayId;
    private String placeName;
    private String placeType;
    private BigDecimal lat;
    private BigDecimal lng;
    private Integer orderIndex;
    private Integer suggestedDuration;
    private String highlight;
    private String description;
    private String openTime;
    private String ticketInfo;
    private String transportFromPrev;
    private BigDecimal estimatedCost;
    private String note;
}
