package com.trip.planner.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;

@Data
public class NodeReorderRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "dayId不能为空")
    private Long dayId;

    /** 按新顺序排列的节点ID列表 */
    @NotEmpty(message = "nodeIds不能为空")
    private List<Long> nodeIds;
}
