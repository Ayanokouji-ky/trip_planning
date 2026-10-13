package com.trip.planner.mapper;

import com.trip.planner.entity.AiGeneration;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AiGenerationMapper {

    int insert(AiGeneration record);

    int updateStatus(@Param("id") Long id, @Param("status") String status, @Param("errorMessage") String errorMessage, @Param("planId") Long planId);

    /** 写入发起生成的用户ID（在 AiService insert 之后由 AiGenerateServiceImpl 调用） */
    int updateUserId(@Param("id") Long id, @Param("userId") Long userId);

    AiGeneration selectById(@Param("id") Long id);
}
