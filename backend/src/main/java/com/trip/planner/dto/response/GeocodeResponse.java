package com.trip.planner.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class GeocodeResponse {

    private String address;
    private BigDecimal lat;
    private BigDecimal lng;
    private Integer confidence;
    private String level;

    public static GeocodeResponse of(BigDecimal lat, BigDecimal lng, String address) {
        GeocodeResponse resp = new GeocodeResponse();
        resp.lat = lat;
        resp.lng = lng;
        resp.address = address;
        return resp;
    }
}
