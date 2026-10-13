package com.trip.planner.mapper;

import com.trip.planner.entity.ImageImport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ImageImportMapper {

    int insert(ImageImport record);

    ImageImport selectById(@Param("id") Long id);

    /** 识别成功：写入识别 JSON、实际使用模型与关联的 ai_generation 记录ID */
    int updateRecognized(@Param("id") Long id,
                         @Param("modelName") String modelName,
                         @Param("recognizedJson") String recognizedJson,
                         @Param("aiGenerationId") Long aiGenerationId);

    /** 识别失败：记录错误原因 */
    int updateFailed(@Param("id") Long id, @Param("errorMessage") String errorMessage);

    /** 确认生成：关联 planId，状态置 CONFIRMED，可回写用户编辑后的行程 JSON */
    int updateConfirm(@Param("id") Long id,
                      @Param("planId") Long planId,
                      @Param("recognizedJson") String recognizedJson);
}
