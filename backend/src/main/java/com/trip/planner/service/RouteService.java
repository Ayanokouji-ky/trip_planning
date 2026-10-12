package com.trip.planner.service;

import com.trip.planner.entity.PlanRoute;

import java.util.List;

public interface RouteService {

    /** 按天重新计算行程全部路线（先删后算，单点失败不中断） */
    List<PlanRoute> recalculate(Long planId);
}
