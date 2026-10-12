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
        String baseUrl = appProperties.getBaidu().getRouteUrl();
        String mode = transportMode != null ? transportMode : "driving";
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
            Map<String, Object> firstRoute = routes.get(0);
            BigDecimal distance = new BigDecimal(String.valueOf(firstRoute.get("distance")));
            Integer duration = Integer.valueOf(String.valueOf(firstRoute.get("duration")));

            RouteInfoResponse routeResp = RouteInfoResponse.of(distance, duration, mode);
            routeResp.setSource("baidu");
            log.info("Route: {}m, {}s", distance, duration);
            return routeResp;
        } catch (Exception e) {
            log.warn("Route API exception, falling back to GeoUtils: {}", e.getMessage());
            return fallbackRoute(fromLat, fromLng, toLat, toLng, mode);
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
