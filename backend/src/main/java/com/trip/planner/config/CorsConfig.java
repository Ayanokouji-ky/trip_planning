package com.trip.planner.config;

import com.trip.planner.interceptor.JwtInterceptor;
import com.trip.planner.resolver.CurrentUserArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {

    /**
     * 允许的来源，逗号分隔；默认 * 放行所有来源。
     * 生产环境可通过环境变量 CORS_ALLOWED_ORIGINS 收紧，例如：
     * CORS_ALLOWED_ORIGINS=http://1.2.3.4,https://trip.example.com
     */
    @Value("${app.cors.allowed-origins:*}")
    private String[] allowedOrigins;

    private final JwtInterceptor jwtInterceptor;
    private final CurrentUserArgumentResolver currentUserArgumentResolver;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        // 注册 / 登录匿名可访问；GET /api/auth/me 仍需 Token，不在此放行
                        "/api/auth/register",
                        "/api/auth/login",
                        // 健康检查匿名可访问
                        "/api/health",
                        "/api/health/**",
                        // 地图 geocode/route 工具接口匿名可访问
                        "/api/map/**"
                );
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }
}
