package com.trip.planner.mapper;

import com.trip.planner.entity.PlanNode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PlanNodeMapper {

    int insert(PlanNode node);

    int batchInsert(@Param("list") List<PlanNode> nodes);

    int update(PlanNode node);

    int deleteById(@Param("id") Long id);

    int deleteByPlanId(@Param("planId") Long planId);

    int deleteByDayId(@Param("dayId") Long dayId);

    PlanNode selectById(@Param("id") Long id);

    List<PlanNode> selectByPlanId(@Param("planId") Long planId);

    List<PlanNode> selectByDayId(@Param("dayId") Long dayId);
}
