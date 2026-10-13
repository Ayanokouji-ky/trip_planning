package com.trip.planner.service.impl;

import com.trip.planner.config.AppProperties;
import com.trip.planner.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 实现基于 jjwt 0.11.5：
 * - HS256 + Keys.hmacShaKeyFor（密钥 >= 32 字节）
 * - subject = userId 字符串
 * - 自定义 claim: username
 * - 过期时间由 app.jwt.expiration-ms 控制（默认 7 天）
 */
@Slf4j
@Service
public class JwtServiceImpl implements JwtService {

    private final AppProperties appProperties;
    private SecretKey signKey;
    private JwtParser parser;

    public JwtServiceImpl(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @PostConstruct
    public void init() {
        String secret = appProperties.getJwt().getSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret 长度不足，HS256 要求密钥至少 32 字节，请检查 application.yml");
        }
        this.signKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.parser = Jwts.parserBuilder().setSigningKey(signKey).build();
        log.info("JwtService initialized, expirationMs={}", appProperties.getJwt().getExpirationMs());
    }

    @Override
    public String generateToken(Long userId, String username) {
        long now = System.currentTimeMillis();
        long exp = now + appProperties.getJwt().getExpirationMs();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("username", username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(signKey, SignatureAlgorithm.HS256)
                .compact();
    }

    @Override
    public Long parseUserId(String token) {
        Claims body = parseClaims(token);
        if (body == null) {
            return null;
        }
        String subject = body.getSubject();
        if (subject == null) {
            return null;
        }
        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException e) {
            log.debug("JWT subject is not a valid userId: {}", subject);
            return null;
        }
    }

    @Override
    public String parseUsername(String token) {
        Claims body = parseClaims(token);
        if (body == null) {
            return null;
        }
        Object username = body.get("username");
        return username == null ? null : String.valueOf(username);
    }

    private Claims parseClaims(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        try {
            Jws<Claims> jws = parser.parseClaimsJws(token);
            return jws.getBody();
        } catch (Exception e) {
            log.debug("JWT parse failed: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public boolean validate(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        try {
            parser.parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT validate failed: {}", e.getMessage());
            return false;
        }
    }
}
