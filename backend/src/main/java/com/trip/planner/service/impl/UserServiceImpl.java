package com.trip.planner.service.impl;

import com.trip.planner.dto.request.LoginRequest;
import com.trip.planner.dto.request.RegisterRequest;
import com.trip.planner.dto.response.LoginResponse;
import com.trip.planner.dto.response.UserResponse;
import com.trip.planner.entity.User;
import com.trip.planner.exception.BusinessException;
import com.trip.planner.mapper.UserMapper;
import com.trip.planner.service.JwtService;
import com.trip.planner.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务：
 * - 注册：BCrypt 加盐哈希，username 唯一性校验
 * - 登录：BCrypt 校验密码，成功后颁发 JWT
 * - getById：从 UserContext 取的 userId 反查用户信息
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse register(RegisterRequest request) {
        // 1. 用户名唯一性校验
        User existed = userMapper.findByUsername(request.getUsername());
        if (existed != null) {
            throw new BusinessException(400, "用户名已存在");
        }

        // 2. 构造用户实体（默认 USER 角色；邮箱可选，空串归一化为 null）
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        String email = request.getEmail();
        user.setEmail(email != null && !email.trim().isEmpty() ? email.trim() : null);
        user.setRole("USER");
        userMapper.insert(user);
        log.info("User registered: id={}, username={}", user.getId(), user.getUsername());

        return toResponse(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // 1. 查询用户
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 2. 校验密码（BCrypt 自带盐，matches 已包含时序安全比较）
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 3. 颁发 Token
        String token = jwtService.generateToken(user.getId(), user.getUsername());
        log.info("User login: id={}, username={}", user.getId(), user.getUsername());
        return new LoginResponse(token, toResponse(user));
    }

    @Override
    public UserResponse getById(Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "未登录");
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setEmail(user.getEmail());
        resp.setPhone(user.getPhone());
        resp.setAvatar(user.getAvatar());
        resp.setRole(user.getRole());
        resp.setCreatedAt(user.getCreatedAt());
        return resp;
    }
}
