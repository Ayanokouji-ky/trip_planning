package com.trip.planner.service;

import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.request.PlanSaveRequest;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.TravelPlan;

import java.util.List;

public interface PlanService {

    List<TravelPlan> list();

    PlanDetailResponse getDetail(Long id);

    TravelPlan create(PlanSaveRequest request);

    /**
     * 由 AI 生成结果持久化完整行程（plan + days + nodes + routes），单事务。
     * 逐节点 geocode（50ms 限流），逐路线 route 查询；单点失败不中断整体。
     */
    TravelPlan createFromAi(AiItineraryDto itinerary, String title);

    TravelPlan update(Long id, PlanSaveRequest request);

    void delete(Long id);

    /** 深拷贝行程（含 days/nodes/routes，ID 重映射） */
    TravelPlan copy(Long id);
}
