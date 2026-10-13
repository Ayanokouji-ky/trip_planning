package com.trip.planner.controller;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.dto.request.NodeReorderRequest;
import com.trip.planner.dto.request.NodeSaveRequest;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.entity.PlanNode;
import com.trip.planner.entity.PlanRoute;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.NodeService;
import com.trip.planner.service.PlanService;
import com.trip.planner.service.RouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/plans/{planId}")
@RequiredArgsConstructor
public class NodeController {

    private final NodeService nodeService;
    private final RouteService routeService;
    private final PlanService planService;

    @PostMapping("/nodes")
    public ApiResult<PlanNode> addNode(@PathVariable Long planId,
                                       @Validated @RequestBody NodeSaveRequest request,
                                       @CurrentUser UserContext user) {
        planService.requireOwnership(planId, user.getId());
        return ApiResult.ok(nodeService.addNode(planId, request));
    }

    @PutMapping("/nodes/{nodeId}")
    public ApiResult<PlanNode> updateNode(@PathVariable Long planId,
                                          @PathVariable Long nodeId,
                                          @Validated @RequestBody NodeSaveRequest request,
                                          @CurrentUser UserContext user) {
        planService.requireOwnership(planId, user.getId());
        return ApiResult.ok(nodeService.updateNode(planId, nodeId, request));
    }

    @DeleteMapping("/nodes/{nodeId}")
    public ApiResult<Void> deleteNode(@PathVariable Long planId,
                                      @PathVariable Long nodeId,
                                      @CurrentUser UserContext user) {
        planService.requireOwnership(planId, user.getId());
        nodeService.deleteNode(planId, nodeId);
        return ApiResult.ok();
    }

    @PutMapping("/nodes/reorder")
    public ApiResult<List<PlanNode>> reorder(@PathVariable Long planId,
                                             @Validated @RequestBody NodeReorderRequest request,
                                             @CurrentUser UserContext user) {
        planService.requireOwnership(planId, user.getId());
        return ApiResult.ok(nodeService.reorder(planId, request));
    }

    @PostMapping("/routes/recalculate")
    public ApiResult<List<PlanRoute>> recalculateRoutes(@PathVariable Long planId,
                                                        @CurrentUser UserContext user) {
        planService.requireOwnership(planId, user.getId());
        return ApiResult.ok(routeService.recalculate(planId));
    }
}
