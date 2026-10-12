package com.trip.planner.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

@Data
public class AiGenerateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "旅行需求不能为空")
    private String requirement;

    /** 可选：自定义行程标题，缺省时自动生成 */
    private String title;
}
