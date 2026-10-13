package com.trip.planner.service.impl;

import com.trip.planner.config.AppProperties;
import com.trip.planner.dto.response.GeocodeResponse;
import com.trip.planner.dto.response.RouteInfoResponse;
import com.trip.planner.exception.BusinessException;
import com.trip.planner.service.MapService;
import com.trip.planner.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BaiduMapServiceImpl implements MapService {

    private final AppProperties appProperties;

    @Qualifier("mapRestTemplate")
    private final RestTemplate mapRestTemplate;

    @Override
    @SuppressWarnings("unchecked")
    public GeocodeResponse geocode(String address) {
        String ak = appProperties.getBaidu().getAk();
        String baseUrl = appProperties.getBaidu().getGeocodeUrl();
        URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("address", address)
                .queryParam("output", "json")
                .queryParam("ak", ak)
                .build()
                .toUri();
        log.info("Geocoding: {}", address);

        try {
            Map<String, Object> resp = mapRestTemplate.getForObject(uri, Map.class);
            log.debug("Geocode response: {}", resp);
            if (resp == null) {
                throw new BusinessException("Geocode failed: null response");
            }
            Object statusObj = resp.get("status");
            int status = (statusObj instanceof Number) ? ((Number) statusObj).intValue() : -1;
            if (status != 0) {
                throw new BusinessException("Geocode failed: status=" + status + ", msg=" + resp.get("msg"));
            }
            Map<String, Object> result = (Map<String, Object>) resp.get("result");
            Map<String, Object> location = (Map<String, Object>) result.get("location");
            BigDecimal lat = new BigDecimal(String.valueOf(location.get("lat")));
            BigDecimal lng = new BigDecimal(String.valueOf(location.get("lng")));
            Integer confidence = result.get("confidence") != null
                    ? Integer.valueOf(String.valueOf(result.get("confidence"))) : null;
            String level = result.get("level") != null ? String.valueOf(result.get("level")) : null;

            GeocodeResponse geocodeResp = GeocodeResponse.of(lat, lng, address);
            geocodeResp.setConfidence(confidence);
            geocodeResp.setLevel(level);
            log.info("Geocoded {} -> {},{}", address, lat, lng);
            return geocodeResp;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Geocode error for: {}", address, e);
            throw new BusinessException("Geocode service unavailable: " + e.getMessage());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public RouteInfoResponse route(BigDecimal fromLat, BigDecimal fromLng, BigDecimal toLat, BigDecimal toLng, String transportMode) {
        String ak = appProperties.getBaidu().getAk();
        String mode = transportMode != null ? transportMode : "driving";
        // Phase 19：按出行方式分发到百度 direction v2 对应端点
        String baseUrl = resolveDirectionUrl(mode);
        String origin = fromLat + "," + fromLng;
        String dest = toLat + "," + toLng;
        URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("origin", origin)
                .queryParam("destination", dest)
                .queryParam("ak", ak)
                .build()
                .toUri();
        log.info("Route: {} -> {} ({})", origin, dest, mode);

        try {
            Map<String, Object> resp = mapRestTemplate.getForObject(uri, Map.class);
            if (resp == null) {
                log.warn("Route API null response, falling back to GeoUtils");
                return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
            }
            Object statusObj = resp.get("status");
            int status = (statusObj instanceof Number) ? ((Number) statusObj).intValue() : -1;
            if (status != 0) {
                log.warn("Route API status={}, falling back to GeoUtils", status);
                return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
            }
            Map<String, Object> result = (Map<String, Object>) resp.get("result");
            if (result == null || result.get("routes") == null) {
                return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
            }
            java.util.List<Map<String, Object>> routes = (java.util.List<Map<String, Object>>) result.get("routes");
            if (routes.isEmpty()) {
                return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
            }
            // 公交(transit)可能返回多方案，统一取耗时最短的一条；其余模式取第一条
            Map<String, Object> bestRoute = "transit".equals(mode)
                    ? pickShortestByDuration(routes) : routes.get(0);
            if (bestRoute.get("distance") == null || bestRoute.get("duration") == null) {
                return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
            }
            BigDecimal distance = new BigDecimal(String.valueOf(bestRoute.get("distance")));
            Integer duration = Integer.valueOf(String.valueOf(bestRoute.get("duration")));

            RouteInfoResponse routeResp = RouteInfoResponse.of(distance, duration, mode);
            routeResp.setSource("baidu");
            log.info("Route: {}m, {}s ({})", distance, duration, mode);
            return routeResp;
        } catch (Exception e) {
            log.warn("Route API exception, falling back to GeoUtils: {}", e.getMessage());
            return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
        }
    }

    /** 按出行方式解析百度 direction v2 端点，未配置时回落 driving */
    private String resolveDirectionUrl(String mode) {
        AppProperties.Baidu baidu = appProperties.getBaidu();
        switch (mode) {
            case "walking":
                return baidu.getWalkingUrl() != null ? baidu.getWalkingUrl() : baidu.getRouteUrl();
            case "transit":
                return baidu.getTransitUrl() != null ? baidu.getTransitUrl() : baidu.getRouteUrl();
            case "riding":
                return baidu.getRidingUrl() != null ? baidu.getRidingUrl() : baidu.getRouteUrl();
            case "driving":
            default:
                return baidu.getRouteUrl();
        }
    }

    /** 从多方案中取 duration 最短的一条（transit 场景） */
    private Map<String, Object> pickShortestByDuration(java.util.List<Map<String, Object>> routes) {
        Map<String, Object> best = routes.get(0);
        int bestDuration = parseDuration(best);
        for (Map<String, Object> r : routes) {
            int d = parseDuration(r);
            if (d >= 0 && (bestDuration < 0 || d < bestDuration)) {
                best = r;
                bestDuration = d;
            }
        }
        return best;
    }

    private int parseDuration(Map<String, Object> route) {
        Object duration = route.get("duration");
        if (duration == null) {
            return -1;
        }
        try {
            return Integer.parseInt(String.valueOf(duration));
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private RouteInfoResponse fallbackRoute(BigDecimal fromLat, BigDecimal fromLng,
                                            BigDecimal toLat, BigDecimal toLng, String mode) {
        BigDecimal dist = GeoUtils.haversineMeters(fromLat, fromLng, toLat, toLng);
        int duration = GeoUtils.estimateDurationSeconds(dist.doubleValue(), mode);
        RouteInfoResponse resp = RouteInfoResponse.of(dist, duration, mode);
        resp.setSource("haversine-estimate");
        return resp;
    }
}
