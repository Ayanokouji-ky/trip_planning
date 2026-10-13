package com.trip.planner.service;

import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.request.PlanSaveRequest;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.TravelPlan;

import java.util.List;

public interface PlanService {

    /**
     * 列表查询。
     * @param scope  mine=当前用户行程；public=公共行程
     * @param userId 当前登录用户ID（mine 必填，public 可为 null）
     */
    List<TravelPlan> list(String scope, Long userId);

    PlanDetailResponse getDetail(Long id, Long userId);

    TravelPlan create(PlanSaveRequest request, Long userId);

    /**
     * 由 AI 生成结果持久化完整行程（plan + days + nodes + routes），单事务。
     * 逐节点 geocode（50ms 限流），逐路线 route 查询；单点失败不中断整体。
     */
    TravelPlan createFromAi(AiItineraryDto itinerary, String title, Long userId);

    TravelPlan update(Long id, PlanSaveRequest request, Long userId);

    void delete(Long id, Long userId);

    /** 深拷贝行程（含 days/nodes/routes，ID 重映射），新行程归属当前用户 */
    TravelPlan copy(Long id, Long userId);

    /**
     * 校验当前用户对指定行程有"操作"权限（所有者）。
     * 仅校验，无返回值；权限不足抛 BusinessException(403, "无权操作他人行程")；
     * 行程不存在抛 ResourceNotFoundException。
     * 用于 NodeController 增删改节点等需要写权限的场景。
     */
    void requireOwnership(Long planId, Long userId);
}
