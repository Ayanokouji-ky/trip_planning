package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class PlanDay implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long planId;
    private Integer dayIndex;
    private Date date;
    private String summary;
}
