package com.trip.planner.service.impl;

import com.trip.planner.dto.request.NodeReorderRequest;
import com.trip.planner.dto.request.NodeSaveRequest;
import com.trip.planner.dto.response.GeocodeResponse;
import com.trip.planner.entity.PlanNode;
import com.trip.planner.entity.TravelPlan;
import com.trip.planner.exception.BusinessException;
import com.trip.planner.exception.ResourceNotFoundException;
import com.trip.planner.mapper.PlanDayMapper;
import com.trip.planner.mapper.PlanNodeMapper;
import com.trip.planner.mapper.TravelPlanMapper;
import com.trip.planner.service.MapService;
import com.trip.planner.service.NodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeServiceImpl implements NodeService {

    private final PlanNodeMapper planNodeMapper;
    private final PlanDayMapper planDayMapper;
    private final TravelPlanMapper travelPlanMapper;
    private final MapService mapService;

    @Override
    public PlanNode addNode(Long planId, NodeSaveRequest request) {
        TravelPlan plan = requirePlan(planId);
        requireDay(request.getDayId(), planId);

        PlanNode node = new PlanNode();
        node.setPlanId(planId);
        node.setDayId(request.getDayId());
        node.setPlaceName(request.getPlaceName());
        node.setPlaceType(request.getPlaceType());
        node.setSuggestedDuration(request.getSuggestedDuration());
        node.setHighlight(request.getHighlight());
        node.setDescription(request.getDescription());
        node.setOpenTime(request.getOpenTime());
        node.setTicketInfo(request.getTicketInfo());
        node.setEstimatedCost(request.getEstimatedCost());
        node.setNote(request.getNote());

        // 自动 geocode（带城市前缀提高命中率，失败不中断）
        try {
            GeocodeResponse geo = mapService.geocode(plan.getCity() + request.getPlaceName());
            node.setLat(geo.getLat());
            node.setLng(geo.getLng());
        } catch (Exception e) {
            log.warn("Geocode failed for '{}', node saved without coordinates: {}", request.getPlaceName(), e.getMessage());
        }

        // order_index 追加到当日末尾
        List<PlanNode> dayNodes = planNodeMapper.selectByDayId(request.getDayId());
        node.setOrderIndex(dayNodes.size());

        planNodeMapper.insert(node);
        log.info("Added node id={} to plan={} day={} order={}", node.getId(), planId, request.getDayId(), node.getOrderIndex());
        return node;
    }

    @Override
    public PlanNode updateNode(Long planId, Long nodeId, NodeSaveRequest request) {
        PlanNode existing = requireNode(planId, nodeId);

        PlanNode node = new PlanNode();
        node.setId(nodeId);
        node.setPlaceName(request.getPlaceName());
        node.setPlaceType(request.getPlaceType());
        node.setSuggestedDuration(request.getSuggestedDuration());
        node.setHighlight(request.getHighlight());
        node.setDescription(request.getDescription());
        node.setOpenTime(request.getOpenTime());
        node.setTicketInfo(request.getTicketInfo());
        node.setEstimatedCost(request.getEstimatedCost());
        node.setNote(request.getNote());

        // 地点名称变更时重新 geocode
        if (request.getPlaceName() != null && !request.getPlaceName().equals(existing.getPlaceName())) {
            TravelPlan plan = requirePlan(planId);
            try {
                GeocodeResponse geo = mapService.geocode(plan.getCity() + request.getPlaceName());
                node.setLat(geo.getLat());
                node.setLng(geo.getLng());
            } catch (Exception e) {
                log.warn("Geocode failed on update for '{}': {}", request.getPlaceName(), e.getMessage());
            }
        }

        planNodeMapper.update(node);
        return planNodeMapper.selectById(nodeId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteNode(Long planId, Long nodeId) {
        PlanNode node = requireNode(planId, nodeId);
        planNodeMapper.deleteById(nodeId);

        // 重建当日 order_index
        List<PlanNode> remaining = planNodeMapper.selectByDayId(node.getDayId());
        for (int i = 0; i < remaining.size(); i++) {
            if (remaining.get(i).getOrderIndex() != i) {
                PlanNode update = new PlanNode();
                update.setId(remaining.get(i).getId());
                update.setOrderIndex(i);
                planNodeMapper.update(update);
            }
        }
        log.info("Deleted node id={} from plan={}, rebuilt order for day={}", nodeId, planId, node.getDayId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<PlanNode> reorder(Long planId, NodeReorderRequest request) {
        requireDay(request.getDayId(), planId);
        List<PlanNode> dayNodes = planNodeMapper.selectByDayId(request.getDayId());

        // 校验：提交的 nodeIds 必须与当日节点完全一致
        Set<Long> existingIds = new HashSet<>();
        for (PlanNode n : dayNodes) {
            existingIds.add(n.getId());
        }
        if (request.getNodeIds().size() != existingIds.size() || !existingIds.containsAll(request.getNodeIds())) {
            throw new BusinessException("重排序失败：nodeIds 必须与当日全部节点一致");
        }

        for (int i = 0; i < request.getNodeIds().size(); i++) {
            PlanNode update = new PlanNode();
            update.setId(request.getNodeIds().get(i));
            update.setOrderIndex(i);
            planNodeMapper.update(update);
        }
        log.info("Reordered {} nodes for plan={} day={}", request.getNodeIds().size(), planId, request.getDayId());
        return planNodeMapper.selectByDayId(request.getDayId());
    }

    private TravelPlan requirePlan(Long planId) {
        TravelPlan plan = travelPlanMapper.selectById(planId);
        if (plan == null) {
            throw new ResourceNotFoundException("TravelPlan", planId);
        }
        return plan;
    }

    private void requireDay(Long dayId, Long planId) {
        if (planDayMapper.selectById(dayId) == null) {
            throw new ResourceNotFoundException("PlanDay", dayId);
        }
        // 校验 day 属于该 plan
        List<com.trip.planner.entity.PlanDay> days = planDayMapper.selectByPlanId(planId);
        boolean belongs = days.stream().anyMatch(d -> d.getId().equals(dayId));
        if (!belongs) {
            throw new BusinessException("PlanDay " + dayId + " 不属于行程 " + planId);
        }
    }

    private PlanNode requireNode(Long planId, Long nodeId) {
        PlanNode node = planNodeMapper.selectById(nodeId);
        if (node == null) {
            throw new ResourceNotFoundException("PlanNode", nodeId);
        }
        if (!node.getPlanId().equals(planId)) {
            throw new BusinessException("PlanNode " + nodeId + " 不属于行程 " + planId);
        }
        return node;
    }
}
