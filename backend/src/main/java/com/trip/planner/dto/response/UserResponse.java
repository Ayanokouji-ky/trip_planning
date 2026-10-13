package com.trip.planner.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 对外暴露的用户信息，不含 password。
 */
@Data
public class UserResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String email;
    private String phone;
    private String avatar;
    private String role;
    private Date createdAt;
}
