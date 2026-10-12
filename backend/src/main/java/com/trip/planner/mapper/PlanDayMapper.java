package com.trip.planner.mapper;

import com.trip.planner.entity.PlanDay;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PlanDayMapper {

    int insert(PlanDay day);

    int batchInsert(@Param("list") List<PlanDay> days);

    int update(PlanDay day);

    int deleteByPlanId(@Param("planId") Long planId);

    PlanDay selectById(@Param("id") Long id);

    List<PlanDay> selectByPlanId(@Param("planId") Long planId);
}
