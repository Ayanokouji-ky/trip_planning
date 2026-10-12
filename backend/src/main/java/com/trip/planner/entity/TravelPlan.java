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
    private Date createdAt;
    private Date updatedAt;
}
