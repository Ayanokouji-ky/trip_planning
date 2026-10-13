package com.trip.planner.security;

/**
 * 当前请求线程绑定的用户上下文。
 *
 * 设计：
 * - 内部 ThreadLocal 持有一个 UserContext 实例，包含 userId / username
 * - JwtInterceptor.preHandle 写入；afterCompletion 清理
 * - CurrentUserArgumentResolver 注入 @CurrentUser 参数时返回该实例
 *
 * 必须保证 afterCompletion 一定会执行，避免线程池场景下数据串号。
 */
public class UserContext {

    private static final ThreadLocal<UserContext> HOLDER = new ThreadLocal<>();

    private final Long userId;
    private final String username;

    public UserContext() {
        this(null, null);
    }

    public UserContext(Long userId, String username) {
        this.userId = userId;
        this.username = username;
    }

    public static void set(Long userId, String username) {
        HOLDER.set(new UserContext(userId, username));
    }

    public static UserContext get() {
        return HOLDER.get();
    }

    public static Long getUserId() {
        UserContext ctx = HOLDER.get();
        return ctx == null ? null : ctx.userId;
    }

    public static String getUsername() {
        UserContext ctx = HOLDER.get();
        return ctx == null ? null : ctx.username;
    }

    public static void clear() {
        HOLDER.remove();
    }

    // 实例方法（供 @CurrentUser 注入参数后通过实例访问）
    public Long getId() {
        return userId;
    }

    public String getName() {
        return username;
    }
}
