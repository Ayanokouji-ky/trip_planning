package com.trip.planner.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * 节点 AI 智能填充请求（Phase 18）：只输入地点名称，AI 生成其余字段。
 */
@Data
public class NodeEnrichRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "地点名称不能为空")
    @Size(max = 100, message = "地点名称不能超过 100 个字符")
    private String name;

    /** 可选：所在城市（帮助 AI 消歧，如"宽窄巷子"→成都），缺省由 AI 自行推断 */
    @Size(max = 50, message = "城市不能超过 50 个字符")
    private String city;

    /** 可选：指定 AI 模型 ID，缺省使用默认文本模型 */
    private String model;
}
