package com.trip.planner.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import java.io.Serializable;

@Data
public class PlanSaveRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "行程标题不能为空")
    private String title;

    @NotBlank(message = "目的地城市不能为空")
    private String city;

    @NotNull(message = "行程天数不能为空")
    @Min(value = 1, message = "行程天数至少为1")
    @Max(value = 30, message = "行程天数不能超过30")
    private Integer days;

    private String summary;
}
