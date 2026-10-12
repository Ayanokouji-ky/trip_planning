package com.trip.planner.controller;

import com.trip.planner.dto.response.ApiResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ApiResult<Map<String, Object>> health() {
        Map<String, Object> info = new HashMap<>();
        info.put("status", "up");
        info.put("service", "trip-planner");
        info.put("version", "0.0.1-SNAPSHOT");
        return ApiResult.ok("up", info);
    }
}
