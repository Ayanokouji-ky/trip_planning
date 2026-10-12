package com.trip.planner.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiNodeDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String place_name;
    private String place_type;
    private String time_start;
    private String time_end;
    private Integer suggested_duration;
    private String highlight;
    private String description;
    private String open_time;
    private String ticket_info;
    private String transport_from_previous;
    private BigDecimal estimated_cost;
    private String note;
}
