package com.trip.planner.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    /** BCrypt 加密后的密码哈希，不对外暴露 */
    private String password;
    private String email;
    private String phone;
    private String avatar;
    /** 角色：USER / ADMIN */
    private String role;
    private Date createdAt;
    private Date updatedAt;
}
