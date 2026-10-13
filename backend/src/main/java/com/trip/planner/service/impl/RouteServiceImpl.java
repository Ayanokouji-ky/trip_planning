package com.trip.planner.service.impl;

import com.trip.planner.config.AppProperties;
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
import com.trip.planner.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    /** 步行分档上限（米）：≤1km 推荐步行 */
    private static final double WALKING_MAX_M = 1000;
    /** 公交优先分档上限（米）：1-5km 公交优先 */
    private static final double TRANSIT_SHORT_MAX_M = 5000;
    /** 公交/驾车取优分档上限（米）：5-30km，>30km 纯驾车 */
    private static final double TRANSIT_LONG_MAX_M = 30000;

    private final PlanRouteMapper planRouteMapper;
    private final PlanNodeMapper planNodeMapper;
    private final PlanDayMapper planDayMapper;
    private final TravelPlanMapper travelPlanMapper;
    private final MapService mapService;
    private final AppProperties appProperties;

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
                    PlanRoute route = buildRecommendedRoute(planId, from, to);
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

    /**
     * Phase 19 分档推荐策略（规则基于两点直线距离）：
     * ≤1km 步行；1-5km 公交优先（降级 riding→driving）+ 打车估价；5-30km 公交/驾车取优 + 打车估价；>30km 驾车。
     */
    private PlanRoute buildRecommendedRoute(Long planId, PlanNode from, PlanNode to) {
        double straightM = GeoUtils.haversine(
                from.getLat().doubleValue(), from.getLng().doubleValue(),
                to.getLat().doubleValue(), to.getLng().doubleValue());

        if (straightM <= WALKING_MAX_M) {
            RouteInfoResponse info = mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "walking");
            int minutes = minutesOf(info);
            return assembleRoute(planId, from, to, info, null,
                    String.format("距离 %s，建议步行约 %d 分钟", formatDistanceShort(info.getDistance()), minutes));
        }

        if (straightM <= TRANSIT_SHORT_MAX_M) {
            // 公交优先：transit 失败（未取到百度真实数据）时降级 driving
            RouteInfoResponse transit = mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "transit");
            RouteInfoResponse chosen = "baidu".equals(transit.getSource())
                    ? transit
                    : mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "driving");
            // 公交胜出时打车估价按驾车距离（公交绕行距离会高估车费）
            BigDecimal taxiDistance = "transit".equals(chosen.getTransportMode())
                    ? drivingDistanceForTaxi(from, to) : null;
            return assembleRouteWithTaxi(planId, from, to, chosen, "建议公交/地铁", taxiDistance);
        }

        if (straightM <= TRANSIT_LONG_MAX_M) {
            // 公交/驾车都查，取耗时较短者
            RouteInfoResponse transit = mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "transit");
            RouteInfoResponse driving = mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "driving");
            RouteInfoResponse chosen = pickFaster(transit, driving);
            String label = "transit".equals(chosen.getTransportMode()) ? "建议公交/地铁" : "建议驾车";
            BigDecimal taxiDistance = "transit".equals(chosen.getTransportMode()) ? driving.getDistance() : null;
            return assembleRouteWithTaxi(planId, from, to, chosen, label, taxiDistance);
        }

        // >30km 驾车
        RouteInfoResponse info = mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "driving");
        int minutes = minutesOf(info);
        return assembleRoute(planId, from, to, info, null,
                String.format("距离 %s，建议驾车约 %d 分钟", formatDistanceShort(info.getDistance()), minutes));
    }

    /** 公交/驾车推荐路线：cost 写打车估价，suggestion 附估价（仅供参考） */
    private PlanRoute assembleRouteWithTaxi(Long planId, PlanNode from, PlanNode to,
                                            RouteInfoResponse chosen, String label, BigDecimal taxiDistance) {
        BigDecimal fareBase = taxiDistance != null ? taxiDistance : chosen.getDistance();
        BigDecimal taxiFare = estimateTaxiFare(fareBase);
        int minutes = minutesOf(chosen);
        String suggestion = String.format("%s约 %d 分钟；打车约 %s 元，仅供参考",
                label, minutes, taxiFare.setScale(0, RoundingMode.HALF_UP).toPlainString());
        return assembleRoute(planId, from, to, chosen, taxiFare, suggestion);
    }

    private PlanRoute assembleRoute(Long planId, PlanNode from, PlanNode to,
                                    RouteInfoResponse info, BigDecimal cost, String suggestion) {
        PlanRoute route = new PlanRoute();
        route.setPlanId(planId);
        route.setFromNodeId(from.getId());
        route.setToNodeId(to.getId());
        route.setTransportMode(info.getTransportMode());
        route.setDistance(info.getDistance());
        route.setDuration(info.getDuration());
        route.setCost(cost != null ? cost : info.getCost());
        route.setSuggestion(suggestion);
        return route;
    }

    /** 取耗时较短者；source 非 baidu（降级估算）的优先级降低，同为 baidu 才比较 duration */
    private RouteInfoResponse pickFaster(RouteInfoResponse a, RouteInfoResponse b) {
        boolean aReal = "baidu".equals(a.getSource());
        boolean bReal = "baidu".equals(b.getSource());
        if (aReal && bReal) {
            return a.getDuration() <= b.getDuration() ? a : b;
        }
        if (aReal) return a;
        if (bReal) return b;
        return a; // 都无真实数据，任取其一（估算值）
    }

    /** 打车估价用驾车距离：查 driving 路线，失败返回 null（退回推荐路线距离） */
    private BigDecimal drivingDistanceForTaxi(PlanNode from, PlanNode to) {
        try {
            return mapService.route(from.getLat(), from.getLng(), to.getLat(), to.getLng(), "driving").getDistance();
        } catch (Exception e) {
            log.warn("Driving distance for taxi fare failed {} -> {}: {}", from.getPlaceName(), to.getPlaceName(), e.getMessage());
            return null;
        }
    }

    /** 打车本地估价：base + max(0, km - baseKm) * perKm */
    private BigDecimal estimateTaxiFare(BigDecimal distanceMeters) {
        AppProperties.Route.Taxi taxi = appProperties.getRoute().getTaxi();
        double km = distanceMeters.doubleValue() / 1000.0;
        double fare = taxi.getBasePrice() + Math.max(0, km - taxi.getBaseKm()) * taxi.getPerKm();
        return BigDecimal.valueOf(fare).setScale(2, RoundingMode.HALF_UP);
    }

    private int minutesOf(RouteInfoResponse info) {
        if (info.getDuration() == null) {
            return 0;
        }
        return (int) Math.round(info.getDuration() / 60.0);
    }

    /** 距离简写：1000m 以下显示「850m」，以上显示「2.5km」 */
    private String formatDistanceShort(BigDecimal meters) {
        if (meters == null) {
            return "未知距离";
        }
        double m = meters.doubleValue();
        if (m < 1000) {
            return String.format("%.0fm", m);
        }
        return String.format("%.1fkm", m / 1000.0);
    }
}
