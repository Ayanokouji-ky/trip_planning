package com.trip.planner.controller;

import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.GeocodeResponse;
import com.trip.planner.dto.response.RouteInfoResponse;
import com.trip.planner.service.MapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@Slf4j
@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @GetMapping("/geocode")
    public ApiResult<GeocodeResponse> geocode(@RequestParam String address) {
        GeocodeResponse resp = mapService.geocode(address);
        return ApiResult.ok(resp);
    }

    @GetMapping("/route")
    public ApiResult<RouteInfoResponse> route(
            @RequestParam BigDecimal fromLat,
            @RequestParam BigDecimal fromLng,
            @RequestParam BigDecimal toLat,
            @RequestParam BigDecimal toLng,
            @RequestParam(defaultValue = "driving") String transportMode) {
        RouteInfoResponse resp = mapService.route(fromLat, fromLng, toLat, toLng, transportMode);
        return ApiResult.ok(resp);
    }
}
