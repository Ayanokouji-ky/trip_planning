package com.trip.planner.service;

import com.trip.planner.dto.request.LoginRequest;
import com.trip.planner.dto.request.RegisterRequest;
import com.trip.planner.dto.response.LoginResponse;
import com.trip.planner.dto.response.UserResponse;

public interface UserService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    /** 根据 userId 查询用户信息（不含 password） */
    UserResponse getById(Long userId);
}
