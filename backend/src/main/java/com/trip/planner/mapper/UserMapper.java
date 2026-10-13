package com.trip.planner.mapper;

import com.trip.planner.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    /** 按用户名查询（登录校验、注册唯一性校验） */
    User findByUsername(@Param("username") String username);

    /** 按主键查询 */
    User findById(@Param("id") Long id);

    /** 插入新用户，主键回填到 user.id */
    int insert(User user);
}
