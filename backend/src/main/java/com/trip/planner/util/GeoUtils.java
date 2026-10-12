package com.trip.planner.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class GeoUtils {

    private static final double EARTH_RADIUS_M = 6371000.0;

    private GeoUtils() {
    }

    public static double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_M * c;
    }

    public static BigDecimal haversineMeters(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        double dist = haversine(
                lat1.doubleValue(), lng1.doubleValue(),
                lat2.doubleValue(), lng2.doubleValue()
        );
        return BigDecimal.valueOf(dist).setScale(2, RoundingMode.HALF_UP);
    }

    public static int estimateDurationSeconds(double distanceMeters, String transportMode) {
        double speedMs;
        switch (transportMode != null ? transportMode.toLowerCase() : "driving") {
            case "walking":
                speedMs = 1.4;
                break;
            case "riding":
                speedMs = 5.0;
                break;
            case "transit":
                speedMs = 8.0;
                break;
            case "driving":
            default:
                speedMs = 11.0;
                break;
        }
        return (int) Math.ceil(distanceMeters / speedMs);
    }
}
