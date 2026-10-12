package com.trip.planner.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Baidu baidu = new Baidu();
    private Ai ai = new Ai();

    @Data
    public static class Baidu {
        private String ak;
        private String geocodeUrl;
        private String routeUrl;
    }

    @Data
    public static class Ai {
        private String apiKey;
        private String endpoint;
        private String model;
        private int timeoutMs = 60000;
    }
}
