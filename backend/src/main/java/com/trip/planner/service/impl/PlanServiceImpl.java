package com.trip.planner.service.impl;

import com.trip.planner.dto.ai.AiDayDto;
import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.dto.ai.AiNodeDto;
import com.trip.planner.dto.request.PlanSaveRequest;
import com.trip.planner.dto.response.GeocodeResponse;
import com.trip.planner.dto.response.PlanDetailResponse;
import com.trip.planner.entity.PlanDay;
import com.trip.planner.entity.PlanNode;
import com.trip.planner.entity.PlanRoute;
import com.trip.planner.entity.TravelPlan;
import com.trip.planner.exception.ResourceNotFoundException;
import com.trip.planner.mapper.PlanDayMapper;
import com.trip.planner.mapper.PlanNodeMapper;
import com.trip.planner.mapper.PlanRouteMapper;
import com.trip.planner.mapper.TravelPlanMapper;
import com.trip.planner.service.MapService;
import com.trip.planner.service.PlanService;
import com.trip.planner.service.RouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final TravelPlanMapper travelPlanMapper;
    private final PlanDayMapper planDayMapper;
    private final PlanNodeMapper planNodeMapper;
    private final PlanRouteMapper planRouteMapper;
    private final MapService mapService;
    private final RouteService routeService;

    @Override
    public List<TravelPlan> list() {
        return travelPlanMapper.selectAll();
    }

    @Override
    public PlanDetailResponse getDetail(Long id) {
        TravelPlan plan = travelPlanMapper.selectById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("TravelPlan", id);
        }
        PlanDetailResponse resp = new PlanDetailResponse();
        resp.setPlan(plan);
        resp.setDays(planDayMapper.selectByPlanId(id));
        resp.setNodes(planNodeMapper.selectByPlanId(id));
        resp.setRoutes(planRouteMapper.selectByPlanId(id));
        return resp;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TravelPlan create(PlanSaveRequest request) {
        TravelPlan plan = new TravelPlan();
        plan.setTitle(request.getTitle());
        plan.setCity(request.getCity());
        plan.setDays(request.getDays());
        plan.setStatus("DRAFT");
        plan.setSummary(request.getSummary());
        travelPlanMapper.insert(plan);

        List<PlanDay> days = new ArrayList<>();
        for (int i = 1; i <= request.getDays(); i++) {
            PlanDay day = new PlanDay();
            day.setPlanId(plan.getId());
            day.setDayIndex(i);
            days.add(day);
        }
        planDayMapper.batchInsert(days);
        log.info("Created plan id={}, title={}, days={}", plan.getId(), plan.getTitle(), request.getDays());
        return plan;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TravelPlan createFromAi(AiItineraryDto itinerary, String title) {
        // 1. 主表
        TravelPlan plan = new TravelPlan();
        plan.setTitle(title != null && !title.trim().isEmpty()
                ? title.trim()
                : itinerary.getDestination() + itinerary.getDays() + "日游");
        plan.setCity(itinerary.getDestination());
        plan.setDays(itinerary.getDays());
        plan.setStatus("AI_GENERATED");
        plan.setSummary(itinerary.getSummary());
        travelPlanMapper.insert(plan);

        // 2. 逐天 + 逐节点（geocode 单点失败不中断，50ms 限流）
        int nodeCount = 0;
        int daySeq = 1;
        for (AiDayDto dayDto : itinerary.getItinerary()) {
            PlanDay day = new PlanDay();
            day.setPlanId(plan.getId());
            day.setDayIndex(dayDto.getDay() != null ? dayDto.getDay() : daySeq);
            day.setDate(parseDate(dayDto.getDate()));
            day.setSummary(dayDto.getSummary());
            planDayMapper.insert(day);
            daySeq++;

            if (dayDto.getNodes() == null) {
                continue;
            }
            int order = 0;
            for (AiNodeDto nodeDto : dayDto.getNodes()) {
                PlanNode node = new PlanNode();
                node.setPlanId(plan.getId());
                node.setDayId(day.getId());
                node.setPlaceName(nodeDto.getPlace_name());
                node.setPlaceType(nodeDto.getPlace_type());
                node.setOrderIndex(order++);
                node.setSuggestedDuration(nodeDto.getSuggested_duration());
                node.setHighlight(nodeDto.getHighlight());
                node.setDescription(nodeDto.getDescription());
                node.setOpenTime(nodeDto.getOpen_time());
                node.setTicketInfo(nodeDto.getTicket_info());
                node.setTransportFromPrev(nodeDto.getTransport_from_previous());
                node.setEstimatedCost(nodeDto.getEstimated_cost());
                node.setNote(nodeDto.getNote());

                try {
                    Thread.sleep(50);
                    GeocodeResponse geo = mapService.geocode(plan.getCity() + nodeDto.getPlace_name());
                    node.setLat(geo.getLat());
                    node.setLng(geo.getLng());
                } catch (Exception e) {
                    log.warn("Geocode failed for '{}', saved without coordinates: {}",
                            nodeDto.getPlace_name(), e.getMessage());
                }
                planNodeMapper.insert(node);
                nodeCount++;
            }
        }

        // 3. 路线（同事务内复用 RouteService，单点失败不中断）
        routeService.recalculate(plan.getId());

        log.info("Created plan from AI: id={}, days={}, nodes={}", plan.getId(), itinerary.getDays(), nodeCount);
        return plan;
    }

    private java.util.Date parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            return new SimpleDateFormat("yyyy-MM-dd").parse(dateStr.trim());
        } catch (ParseException e) {
            log.warn("Unparseable day date '{}', ignored", dateStr);
            return null;
        }
    }

    @Override
    public TravelPlan update(Long id, PlanSaveRequest request) {
        TravelPlan existing = travelPlanMapper.selectById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("TravelPlan", id);
        }
        TravelPlan plan = new TravelPlan();
        plan.setId(id);
        plan.setTitle(request.getTitle());
        plan.setSummary(request.getSummary());
        travelPlanMapper.update(plan);
        return travelPlanMapper.selectById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        TravelPlan existing = travelPlanMapper.selectById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("TravelPlan", id);
        }
        // 外键 ON DELETE CASCADE 自动级联删除 days/nodes/routes
        travelPlanMapper.deleteById(id);
        log.info("Deleted plan id={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TravelPlan copy(Long id) {
        TravelPlan source = travelPlanMapper.selectById(id);
        if (source == null) {
            throw new ResourceNotFoundException("TravelPlan", id);
        }
        List<PlanDay> days = planDayMapper.selectByPlanId(id);
        List<PlanNode> nodes = planNodeMapper.selectByPlanId(id);
        List<PlanRoute> routes = planRouteMapper.selectByPlanId(id);

        // 1. 复制主表
        TravelPlan newPlan = new TravelPlan();
        newPlan.setTitle(source.getTitle() + "（副本）");
        newPlan.setCity(source.getCity());
        newPlan.setDays(source.getDays());
        newPlan.setStatus("DRAFT");
        newPlan.setSummary(source.getSummary());
        travelPlanMapper.insert(newPlan);
        Long newPlanId = newPlan.getId();

        // 2. 复制 days，建立 oldDayId -> newDayId 映射
        Map<Long, Long> dayIdMap = new HashMap<>();
        for (PlanDay day : days) {
            PlanDay newDay = new PlanDay();
            newDay.setPlanId(newPlanId);
            newDay.setDayIndex(day.getDayIndex());
            newDay.setDate(day.getDate());
            newDay.setSummary(day.getSummary());
            planDayMapper.insert(newDay);
            dayIdMap.put(day.getId(), newDay.getId());
        }

        // 3. 复制 nodes，建立 oldNodeId -> newNodeId 映射
        Map<Long, Long> nodeIdMap = new HashMap<>();
        for (PlanNode node : nodes) {
            PlanNode newNode = new PlanNode();
            newNode.setPlanId(newPlanId);
            newNode.setDayId(dayIdMap.get(node.getDayId()));
            newNode.setPlaceName(node.getPlaceName());
            newNode.setPlaceType(node.getPlaceType());
            newNode.setLat(node.getLat());
            newNode.setLng(node.getLng());
            newNode.setOrderIndex(node.getOrderIndex());
            newNode.setSuggestedDuration(node.getSuggestedDuration());
            newNode.setHighlight(node.getHighlight());
            newNode.setDescription(node.getDescription());
            newNode.setOpenTime(node.getOpenTime());
            newNode.setTicketInfo(node.getTicketInfo());
            newNode.setTransportFromPrev(node.getTransportFromPrev());
            newNode.setEstimatedCost(node.getEstimatedCost());
            newNode.setNote(node.getNote());
            planNodeMapper.insert(newNode);
            nodeIdMap.put(node.getId(), newNode.getId());
        }

        // 4. 复制 routes，重连新旧节点ID
        for (PlanRoute route : routes) {
            PlanRoute newRoute = new PlanRoute();
            newRoute.setPlanId(newPlanId);
            newRoute.setFromNodeId(nodeIdMap.get(route.getFromNodeId()));
            newRoute.setToNodeId(nodeIdMap.get(route.getToNodeId()));
            newRoute.setTransportMode(route.getTransportMode());
            newRoute.setDistance(route.getDistance());
            newRoute.setDuration(route.getDuration());
            newRoute.setCost(route.getCost());
            if (newRoute.getFromNodeId() != null && newRoute.getToNodeId() != null) {
                planRouteMapper.insert(newRoute);
            }
        }

        log.info("Copied plan id={} -> newId={}, days={}, nodes={}, routes={}",
                id, newPlanId, days.size(), nodes.size(), routes.size());
        return travelPlanMapper.selectById(newPlanId);
    }
}
