package com.trip.planner.mapper;

import com.trip.planner.entity.TravelPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TravelPlanMapper {

    int insert(TravelPlan plan);

    int update(TravelPlan plan);

    int deleteById(@Param("id") Long id);

    TravelPlan selectById(@Param("id") Long id);

    List<TravelPlan> selectAll();

    /** 按用户ID查询其所有行程（按创建时间倒序） */
    List<TravelPlan> selectByUserId(@Param("userId") Long userId);

    /** 查询全部公共行程（is_public=1，按创建时间倒序） */
    List<TravelPlan> selectPublic();

    /**
     * 按 ID 查询用户可访问的行程：
     * - is_public=1 任意人可见
     * - 或 user_id 等于当前用户ID
     * 任一条件满足即返回，否则返回 null
     */
    TravelPlan selectByIdAccessible(@Param("id") Long id, @Param("userId") Long userId);
}
