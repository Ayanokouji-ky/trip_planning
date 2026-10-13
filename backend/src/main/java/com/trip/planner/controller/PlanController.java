package com.trip.planner.controller;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.dto.request.PlanSaveRequest;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.TravelPlan;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ApiResult<List<TravelPlan>> list(@RequestParam(defaultValue = "mine") String scope,
                                           @CurrentUser UserContext user) {
        Long userId = user != null ? user.getId() : null;
        return ApiResult.ok(planService.list(scope, userId));
    }

    @GetMapping("/{id}")
    public ApiResult<PlanDetailResponse> getById(@PathVariable Long id,
                                                @CurrentUser UserContext user) {
        Long userId = user != null ? user.getId() : null;
        return ApiResult.ok(planService.getDetail(id, userId));
    }

    @PostMapping
    public ApiResult<TravelPlan> create(@Validated @RequestBody PlanSaveRequest request,
                                       @CurrentUser UserContext user) {
        return ApiResult.ok(planService.create(request, user.getId()));
    }

    @PutMapping("/{id}")
    public ApiResult<TravelPlan> update(@PathVariable Long id,
                                        @Validated @RequestBody PlanSaveRequest request,
                                        @CurrentUser UserContext user) {
        return ApiResult.ok(planService.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id,
                                   @CurrentUser UserContext user) {
        planService.delete(id, user.getId());
        return ApiResult.ok();
    }

    @PostMapping("/{id}/copy")
    public ApiResult<TravelPlan> copy(@PathVariable Long id,
                                      @CurrentUser UserContext user) {
        return ApiResult.ok(planService.copy(id, user.getId()));
    }
}
