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
    private Route route = new Route();

    @Data
    public static class Baidu {
        private String ak;
        private String geocodeUrl;
        private String routeUrl;
        /** 公交/跨城公交路线规划（Phase 19） */
        private String transitUrl;
        /** 步行路线规划（Phase 19） */
        private String walkingUrl;
        /** 骑行路线规划（Phase 19） */
        private String ridingUrl;
    }

    /**
     * 路线推荐配置（Phase 19）：打车本地估价参数（百度打车 API 需企业授权，本期本地估算）。
     * 估价公式：base + max(0, km - baseKm) * perKm
     */
    @Data
    public static class Route {
        private Taxi taxi = new Taxi();

        @Data
        public static class Taxi {
            /** 起步价（元，含起步里程） */
            private double basePrice = 14;
            /** 起步里程（公里） */
            private double baseKm = 3;
            /** 超出起步里程后每公里单价（元） */
            private double perKm = 2.3;
        }
    }

    @Data
    public static class Ai {
        private String apiKey;
        private String endpoint;
        private String model;
        private int timeoutMs = 60000;
        /** 单次生成最大输出 token 数，防止长尾输出拖长耗时（<=0 时不限制） */
        private int maxOutputTokens = 8000;
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
