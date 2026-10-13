package com.trip.planner.dto.response;

import lombok.Data;

import java.io.Serializable;

@Data
public class LoginResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String token;
    private UserResponse user;

    public LoginResponse(String token, UserResponse user) {
        this.token = token;
        this.user = user;
    }
}
