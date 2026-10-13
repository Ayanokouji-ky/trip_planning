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
    private Jwt jwt = new Jwt();
    private Upload upload = new Upload();

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

    @Data
    public static class Jwt {
        /** HS256 签名密钥（要求 >= 32 字节） */
        private String secret;
        /** Token 有效期（毫秒），默认 7 天 */
        private long expirationMs = 604800000L;
    }

    @Data
    public static class Upload {
        /** 上传图片存储目录（相对/绝对路径均可），默认 uploads */
        private String dir = "uploads";
    }
}
