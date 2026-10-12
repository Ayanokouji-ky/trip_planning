package com.trip.planner.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RouteInfoResponse {

    private BigDecimal distance;
    private Integer duration;
    private String transportMode;
    private BigDecimal cost;
    private String source;

    public static RouteInfoResponse of(BigDecimal distance, Integer duration, String mode) {
        RouteInfoResponse resp = new RouteInfoResponse();
        resp.distance = distance;
        resp.duration = duration;
        resp.transportMode = mode;
        return resp;
    }
}
