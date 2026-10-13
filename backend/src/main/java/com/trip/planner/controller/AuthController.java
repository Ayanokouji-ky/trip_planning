package com.trip.planner.controller;

import com.trip.planner.annotation.CurrentUser;
import com.trip.planner.dto.request.LoginRequest;
import com.trip.planner.dto.request.RegisterRequest;
import com.trip.planner.dto.response.ApiResult;
import com.trip.planner.dto.response.LoginResponse;
import com.trip.planner.dto.response.UserResponse;
import com.trip.planner.security.UserContext;
import com.trip.planner.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口：注册 / 登录 / 当前用户。
 * 全部映射到 /api/auth/**，由 JwtInterceptor 在 CorsConfig 中放行。
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ApiResult<UserResponse> register(@Validated @RequestBody RegisterRequest request) {
        return ApiResult.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ApiResult<LoginResponse> login(@Validated @RequestBody LoginRequest request) {
        return ApiResult.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ApiResult<UserResponse> me(@CurrentUser UserContext user) {
        return ApiResult.ok(userService.getById(user.getId()));
    }
}
