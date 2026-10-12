package com.trip.planner.service;

import com.trip.planner.dto.request.NodeReorderRequest;
import com.trip.planner.dto.request.NodeSaveRequest;
import com.trip.planner.entity.PlanNode;

import java.util.List;

public interface NodeService {

    /** 新增节点（自动 geocode，追加到当日末尾） */
    PlanNode addNode(Long planId, NodeSaveRequest request);

    PlanNode updateNode(Long planId, Long nodeId, NodeSaveRequest request);

    /** 删除节点并重建当日 order_index */
    void deleteNode(Long planId, Long nodeId);

    /** 批量重排序（事务） */
    List<PlanNode> reorder(Long planId, NodeReorderRequest request);
}
