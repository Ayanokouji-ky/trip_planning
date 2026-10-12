package com.trip.planner.mapper;

import com.trip.planner.entity.AiGeneration;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AiGenerationMapper {

    int insert(AiGeneration record);

    int updateStatus(@Param("id") Long id, @Param("status") String status, @Param("errorMessage") String errorMessage, @Param("planId") Long planId);

    AiGeneration selectById(@Param("id") Long id);
}
