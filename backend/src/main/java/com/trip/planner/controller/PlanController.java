package com.trip.planner.controller;

import com.trip.planner.dto.request.PlanSaveRequest;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.TravelPlan;
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
    public ApiResult<List<TravelPlan>> list() {
        return ApiResult.ok(planService.list());
    }

    @GetMapping("/{id}")
    public ApiResult<PlanDetailResponse> getById(@PathVariable Long id) {
        return ApiResult.ok(planService.getDetail(id));
    }

    @PostMapping
    public ApiResult<TravelPlan> create(@Validated @RequestBody PlanSaveRequest request) {
        return ApiResult.ok(planService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResult<TravelPlan> update(@PathVariable Long id,
                                        @Validated @RequestBody PlanSaveRequest request) {
        return ApiResult.ok(planService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        planService.delete(id);
        return ApiResult.ok();
    }

    @PostMapping("/{id}/copy")
    public ApiResult<TravelPlan> copy(@PathVariable Long id) {
        return ApiResult.ok(planService.copy(id));
    }
}
