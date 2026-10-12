package com.trip.planner.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class NodeSaveRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "dayId不能为空")
    private Long dayId;

    @NotBlank(message = "地点名称不能为空")
    private String placeName;

    private String placeType;
    private Integer suggestedDuration;
    private String highlight;
    private String description;
    private String openTime;
    private String ticketInfo;
    private BigDecimal estimatedCost;
    private String note;
}
