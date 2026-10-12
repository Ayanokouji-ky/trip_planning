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
}
