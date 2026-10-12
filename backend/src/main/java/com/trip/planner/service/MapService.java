package com.trip.planner.service;

import com.trip.planner.dto.response.GeocodeResponse;
import com.trip.planner.dto.response.RouteInfoResponse;

import java.math.BigDecimal;

public interface MapService {

    GeocodeResponse geocode(String address);

    RouteInfoResponse route(BigDecimal fromLat, BigDecimal fromLng, BigDecimal toLat, BigDecimal toLng, String transportMode);
}
