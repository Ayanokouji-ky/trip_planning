package com.trip.planner.interceptor;

import com.trip.planner.exception.BusinessException;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * JWT 鉴权拦截器：
 * - preHandle：解析 Authorization: Bearer {token}，校验有效后写入 UserContext
 * - afterCompletion：清理 ThreadLocal，避免线程池串号
 *
 * 放行规则由 CorsConfig.addInterceptors 的 excludePathPatterns 决定，
 * 此处仅负责已拦截路径的处理。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // OPTIONS 预检直接放行
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader(AUTH_HEADER);

        // 可选鉴权路径（GET /api/plans 和 GET /api/plans/{id}）：
        // 公共行程任何人可见，有 Token 则解析注入 UserContext，无 Token 则放行
        if (isOptionalAuthPath(request)) {
            if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
                String token = authHeader.substring(BEARER_PREFIX.length()).trim();
                if (jwtService.validate(token)) {
                    Long userId = jwtService.parseUserId(token);
                    if (userId != null) {
                        UserContext.set(userId, jwtService.parseUsername(token));
                    }
                }
            }
            return true;
        }

        // 强制鉴权路径
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            log.debug("Missing or invalid Authorization header, path={}", request.getRequestURI());
            throw new BusinessException(401, "未登录或 Token 缺失");
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (!jwtService.validate(token)) {
            log.debug("Invalid JWT, path={}", request.getRequestURI());
            throw new BusinessException(401, "Token 无效或已过期");
        }

        Long userId = jwtService.parseUserId(token);
        if (userId == null) {
            throw new BusinessException(401, "Token 无效或已过期");
        }
        String username = jwtService.parseUsername(token);

        // 注入到 ThreadLocal，供 Controller / Service 取用
        UserContext.set(userId, username);
        return true;
    }

    /**
     * 判断是否为可选鉴权路径：
     * GET /api/plans（列表，scope=public 任何人可见）和 GET /api/plans/{id}（公共行程详情任何人可见）
     * GET /api/ai/models（模型列表，公开数据）
     * 有 Token 时解析注入 UserContext，无 Token 时放行（Controller/Service 按 user==null 处理）
     */
    private boolean isOptionalAuthPath(HttpServletRequest request) {
        if (!HttpMethod.GET.matches(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri.equals("/api/plans") || uri.startsWith("/api/plans/") || uri.equals("/api/ai/models");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                               Object handler, Exception ex) {
        UserContext.clear();
    }
}
