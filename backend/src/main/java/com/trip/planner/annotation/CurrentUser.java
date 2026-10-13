package com.trip.planner.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Controller 方法参数注解：从 UserContext 注入当前登录用户信息。
 *
 * 由 CurrentUserArgumentResolver 处理，从 ThreadLocal 中读取当前请求的
 * userId / username，封装为 UserContext 实例注入到方法参数。
 *
 * 用法示例：
 *   public ApiResult&lt;...&gt; create(@CurrentUser UserContext user, ...)
 *
 * 如果当前请求未通过 JwtInterceptor（即未登录），参数将为 null；
 * 默认情况下受保护路径已在拦截器抛出 401，不会进入到这里。
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {
}
