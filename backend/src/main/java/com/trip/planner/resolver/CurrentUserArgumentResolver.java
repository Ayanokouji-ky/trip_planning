package com.trip.planner.resolver;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.security.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * 处理 @CurrentUser 注解参数：
 * 从 ThreadLocal 取当前请求的 UserContext 实例注入。
 *
 * 注意：受保护路径下，JwtInterceptor 已经在 preHandle 抛 401 阻止未登录请求；
 * 本 Resolver 一般能拿到非 null 的 UserContext。若 UserContext 为 null（例如放行路径误用注解），
 * 返回一个空 UserContext（其 getUserId() 为 null），由 Controller/Service 决定如何处理。
 */
@Slf4j
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(UserContext.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        UserContext ctx = UserContext.get();
        if (ctx == null) {
            // 放行路径上误用了 @CurrentUser，给个空对象避免 NPE
            log.warn("No UserContext in ThreadLocal for path; consider checking JwtInterceptor exclude paths");
            return new UserContext();
        }
        return ctx;
    }
}
