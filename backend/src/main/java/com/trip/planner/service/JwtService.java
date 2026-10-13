package com.trip.planner.service;

public interface JwtService {

    /** 生成 Token，subject=userId，自定义 claim: username */
    String generateToken(Long userId, String username);

    /** 解析 Token 中的 userId，校验失败返回 null */
    Long parseUserId(String token);

    /** 解析 Token 中的 username，校验失败返回 null */
    String parseUsername(String token);

    /** 校验 Token 是否有效（签名正确 + 未过期） */
    boolean validate(String token);
}
