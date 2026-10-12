package com.trip.planner.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trip.planner.exception.AiGenerationException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JsonExtractor {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private JsonExtractor() {
    }

    public static <T> T extract(String raw, Class<T> targetType) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new AiGenerationException("AI 返回内容为空");
        }

        // 第1步：直接解析
        try {
            return MAPPER.readValue(raw.trim(), targetType);
        } catch (Exception e) {
            log.debug("JsonExtractor step1 failed: {}", e.getMessage());
        }

        // 第2步：去除 markdown 代码块标记
        String cleaned = raw.trim()
                .replaceAll("(?s)^\\s*```(?:json)?\\s*", "")
                .replaceAll("(?s)\\s*```\\s*$", "")
                .trim();
        try {
            return MAPPER.readValue(cleaned, targetType);
        } catch (Exception e) {
            log.debug("JsonExtractor step2 failed: {}", e.getMessage());
        }

        // 第3步：截取首个 { 到最后一个 }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            String jsonPart = cleaned.substring(start, end + 1);
            try {
                return MAPPER.readValue(jsonPart, targetType);
            } catch (Exception e) {
                log.debug("JsonExtractor step3 failed: {}", e.getMessage());
            }
        }

        // 第4步：抛异常
        log.error("JsonExtractor all steps failed, raw content head: {}",
                raw.substring(0, Math.min(300, raw.length())));
        throw new AiGenerationException("无法从 AI 返回内容中解析出 JSON");
    }
}
