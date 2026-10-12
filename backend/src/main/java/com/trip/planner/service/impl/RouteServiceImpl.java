package com.trip.planner.service.impl;

import com.trip.planner.dto.response.RouteInfoResponse;
import com.trip.planner.entity.PlanDay;
import com.trip.planner.entity.PlanNode;
import com.trip.planner.entity.PlanRoute;
import com.trip.planner.exception.ResourceNotFoundException;
import com.trip.planner.mapper.PlanDayMapper;
import com.trip.planner.mapper.PlanNodeMapper;
import com.trip.planner.mapper.PlanRouteMapper;
import com.trip.planner.mapper.TravelPlanMapper;
import com.trip.planner.service.MapService;
import com.trip.planner.service.RouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final PlanRouteMapper planRouteMapper;
    private final PlanNodeMapper planNodeMapper;
    private final PlanDayMapper planDayMapper;
    private final TravelPlanMapper travelPlanMapper;
    private final MapService mapService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<PlanRoute> recalculate(Long planId) {
        if (travelPlanMapper.selectById(planId) == null) {
            throw new ResourceNotFoundException("TravelPlan", planId);
        }

        // 清除旧路线
        planRouteMapper.deleteByPlanId(planId);

        List<PlanRoute> created = new ArrayList<>();
        List<PlanDay> days = planDayMapper.selectByPlanId(planId);
        for (PlanDay day : days) {
            List<PlanNode> nodes = planNodeMapper.selectByDayId(day.getId());
            for (int i = 0; i < nodes.size() - 1; i++) {
                PlanNode from = nodes.get(i);
                PlanNode to = nodes.get(i + 1);
                // 缺少坐标的节点跳过（单点失败不中断）
                if (from.getLat() == null || from.getLng() == null
                        || to.getLat() == null || to.getLng() == null) {
                    log.warn("Skip route {} -> {}: missing coordinates", from.getPlaceName(), to.getPlaceName());
                    continue;
                }
                try {
                    RouteInfoResponse info = mapService.route(
                            from.getLat(), from.getLng(), to.getLat(), to.getLng(), "driving");
                    PlanRoute route = new PlanRoute();
                    route.setPlanId(planId);
                    route.setFromNodeId(from.getId());
                    route.setToNodeId(to.getId());
                    route.setTransportMode(info.getTransportMode());
                    route.setDistance(info.getDistance());
                    route.setDuration(info.getDuration());
                    route.setCost(info.getCost());
                    planRouteMapper.insert(route);
                    created.add(route);
                } catch (Exception e) {
                    log.warn("Route calc failed {} -> {}: {}", from.getPlaceName(), to.getPlaceName(), e.getMessage());
                }
            }
        }
        log.info("Recalculated {} routes for plan={}", created.size(), planId);
        return created;
    }
}
