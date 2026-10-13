package com.trip.planner.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trip.planner.exception.AiGenerationException;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayDeque;
import java.util.Deque;

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

        // 第3.5步：修复截断的 JSON（模型输出被提前截断时，在最后一个完整的 '}' 处截断并补齐闭合括号）
        if (start >= 0) {
            String repaired = repairTruncatedJson(cleaned.substring(start));
            if (repaired != null) {
                try {
                    log.warn("JsonExtractor repaired truncated JSON, cutLength={}", repaired.length());
                    return MAPPER.readValue(repaired, targetType);
                } catch (Exception e) {
                    log.debug("JsonExtractor step3.5 (repair) failed: {}", e.getMessage());
                }
            }
        }

        // 第4步：抛异常
        log.error("JsonExtractor all steps failed, raw content head: {}",
                raw.substring(0, Math.min(300, raw.length())));
        throw new AiGenerationException("无法从 AI 返回内容中解析出 JSON");
    }

    /**
     * 修复被提前截断的 JSON：截取到最后一个字符串外完整的 '}'，扫描括号栈后补齐闭合符。
     * 若截断点落在字符串内部或括号不匹配，返回 null（无法安全修复）。
     */
    private static String repairTruncatedJson(String s) {
        if (s == null || s.isEmpty()) {
            return null;
        }
        // 找最后一个不在字符串内的 '}'
        int lastBrace = -1;
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (inString && c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (!inString && c == '}') {
                lastBrace = i;
            }
        }
        if (lastBrace <= 0) {
            return null;
        }
        String cut = s.substring(0, lastBrace + 1);

        // 扫描 cut 的括号栈，补齐未闭合部分
        Deque<Character> stack = new ArrayDeque<>();
        inString = false;
        escaped = false;
        for (int i = 0; i < cut.length(); i++) {
            char c = cut.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (inString && c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (c == '{' || c == '[') {
                stack.push(c);
            } else if (c == '}' || c == ']') {
                if (stack.isEmpty()) {
                    return null;
                }
                char open = stack.pop();
                if ((open == '{' && c != '}') || (open == '[' && c != ']')) {
                    return null;
                }
            }
        }
        if (inString || stack.isEmpty()) {
            return null;
        }
        StringBuilder closers = new StringBuilder();
        while (!stack.isEmpty()) {
            closers.append(stack.pop() == '{' ? '}' : ']');
        }
        return cut + closers;
    }
}
