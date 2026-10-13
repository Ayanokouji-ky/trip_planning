package com.trip.planner.constant;

import com.trip.planner.dto.response.ModelInfo;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * AI 模型白名单常量（来源：API.md）。
 * <p>
 * 文本模型 6 个，识图模型 3 个。前端可通过 GET /api/ai/models?type=text|image 获取列表。
 */
public final class ModelConstants {

    private ModelConstants() {}

    // ===== 默认模型 =====
    public static final String DEFAULT_TEXT_MODEL = "deepseek-v4-1-flash-260910";
    public static final String DEFAULT_IMAGE_MODEL = "doubao-seed-2-1-pro-260915";

    // ===== 文本模型白名单 =====
    public static final List<ModelInfo> TEXT_MODELS = Collections.unmodifiableList(Arrays.asList(
            new ModelInfo("deepseek-v4-1-flash-260910", "DeepSeek V4.1 Flash", "推荐", "默认模型，速度与质量均衡"),
            new ModelInfo("deepseek-v4-pro-260425", "DeepSeek V4 Pro", "质量优先", "生成质量最高，耗时较长"),
            new ModelInfo("glm-5-3-flash-260828", "GLM-5-3 Flash", "国产轻量", "国产模型，轻量快速"),
            new ModelInfo("deepseek-v4-pro-ga-260813", "DeepSeek V4 Pro GA", "GA 稳定", "GA 稳定版，适合生产环境"),
            new ModelInfo("deepseek-v4-flash-ga-260731", "DeepSeek V4 Flash GA", "GA 轻量", "GA 轻量版，响应快"),
            new ModelInfo("glm-5-2-260617", "GLM-5-2", "国产", "GLM 基础版")
    ));

    // ===== 识图模型白名单 =====
    public static final List<ModelInfo> IMAGE_MODELS = Collections.unmodifiableList(Arrays.asList(
            new ModelInfo("doubao-seed-2-1-pro-260915", "豆包 Seed 2.1 Pro", "质量优先", "默认识图模型，识别精度最高"),
            new ModelInfo("doubao-seed-2-1-turbo-260628", "豆包 Seed 2.1 Turbo", "均衡", "速度与精度均衡"),
            new ModelInfo("doubao-seed-2-1-lite-260915", "豆包 Seed 2.1 Lite", "速度快", "速度优先，适合批量识图")
    ));

    /**
     * 判断模型 ID 是否在文本白名单中。
     */
    public static boolean isValidTextModel(String model) {
        if (model == null || model.trim().isEmpty()) return false;
        return TEXT_MODELS.stream().anyMatch(m -> m.getId().equals(model));
    }

    /**
     * 判断模型 ID 是否在识图白名单中。
     */
    public static boolean isValidImageModel(String model) {
        if (model == null || model.trim().isEmpty()) return false;
        return IMAGE_MODELS.stream().anyMatch(m -> m.getId().equals(model));
    }

    /**
     * 判断模型 ID 是否在任一白名单中。
     */
    public static boolean isValidModel(String model) {
        return isValidTextModel(model) || isValidImageModel(model);
    }
}
