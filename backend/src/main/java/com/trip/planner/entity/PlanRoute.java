package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class PlanRoute implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long planId;
    private Long fromNodeId;
    private Long toNodeId;
    private String transportMode;
    private BigDecimal distance;
    private Integer duration;
    private BigDecimal cost;
}
