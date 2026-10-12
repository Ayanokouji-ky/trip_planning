package com.trip.planner.mapper;

import com.trip.planner.entity.PlanRoute;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PlanRouteMapper {

    int insert(PlanRoute route);

    int batchInsert(@Param("list") List<PlanRoute> routes);

    int update(PlanRoute route);

    int deleteByPlanId(@Param("planId") Long planId);

    List<PlanRoute> selectByPlanId(@Param("planId") Long planId);
}
