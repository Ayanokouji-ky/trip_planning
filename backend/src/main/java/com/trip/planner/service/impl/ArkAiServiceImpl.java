package com.trip.planner.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trip.planner.config.AppProperties;
import com.trip.planner.dto.ai.AiGenerateResult;
import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.entity.AiGeneration;
import com.trip.planner.exception.AiGenerationException;
import com.trip.planner.mapper.AiGenerationMapper;
import com.trip.planner.service.AiService;
import com.trip.planner.util.JsonExtractor;
import com.trip.planner.util.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArkAiServiceImpl implements AiService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AppProperties appProperties;
    private final AiGenerationMapper aiGenerationMapper;

    @Qualifier("aiRestTemplate")
    private final RestTemplate aiRestTemplate;

    @Override
    public AiGenerateResult generateItinerary(String userRequirement) {
        AppProperties.Ai ai = appProperties.getAi();
        String prompt = PromptBuilder.buildSystemPrompt() + "\n\n" + PromptBuilder.buildUserPrompt(userRequirement);

        // 写入 PENDING 记录
        AiGeneration record = new AiGeneration();
        record.setInputType("TEXT");
        record.setInputContent(userRequirement);
        record.setModelName(ai.getModel());
        record.setPrompt(prompt);
        record.setStatus("PENDING");
        aiGenerationMapper.insert(record);

        try {
            String rawOutput = callArkApi(ai, prompt);
            record.setOutputJson(rawOutput);
            AiItineraryDto itinerary = JsonExtractor.extract(rawOutput, AiItineraryDto.class);
            validate(itinerary);
            aiGenerationMapper.updateStatus(record.getId(), "SUCCESS", null, null);
            log.info("AI generation SUCCESS, recordId={}", record.getId());
            return new AiGenerateResult(record.getId(), itinerary);
        } catch (Exception e) {
            log.error("AI generation FAILED, recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw e instanceof AiGenerationException
                    ? (AiGenerationException) e
                    : new AiGenerationException("AI 调用失败: " + e.getMessage(), e);
        }
    }

    private String callArkApi(AppProperties.Ai ai, String prompt) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("model", ai.getModel());
        body.put("stream", false);

        ArrayNode input = body.putArray("input");
        ObjectNode userMsg = input.addObject();
        userMsg.put("role", "user");
        ArrayNode content = userMsg.putArray("content");
        ObjectNode textPart = content.addObject();
        textPart.put("type", "input_text");
        textPart.put("text", prompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(ai.getApiKey());

        log.info("Calling Ark API, model={}", ai.getModel());
        JsonNode root = aiRestTemplate.postForObject(
                ai.getEndpoint(), new HttpEntity<>(body, headers), JsonNode.class);
        if (root == null) {
            throw new AiGenerationException("Ark API 返回为空");
        }
        log.debug("Ark raw response: {}", root.toString().substring(0, Math.min(500, root.toString().length())));
        return extractTextFromResponse(root);
    }

    /**
     * 从 responses API 响应中提取文本输出，兼容 output_text / content 数组两种结构。
     */
    private String extractTextFromResponse(JsonNode root) {
        {
            JsonNode output = root.get("output");
            if (output != null && output.isArray()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode item : output) {
                    JsonNode content = item.get("content");
                    if (content != null && content.isArray()) {
                        for (JsonNode part : content) {
                            JsonNode text = part.get("text");
                            if (text != null && text.isTextual()) {
                                sb.append(text.asText());
                            }
                        }
                    }
                }
                if (sb.length() > 0) {
                    return sb.toString();
                }
            }
            // 兜底：尝试 choices/message 结构
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.get("content") != null) {
                    return message.get("content").asText();
                }
            }
        }
        throw new AiGenerationException("无法解析 Ark API 响应结构");
    }

    private void validate(AiItineraryDto itinerary) {
        if (itinerary == null || itinerary.getItinerary() == null || itinerary.getItinerary().isEmpty()) {
            throw new AiGenerationException("AI 返回的行程缺少 itinerary 数据");
        }
        if (itinerary.getDays() == null) {
            itinerary.setDays(itinerary.getItinerary().size());
        }
    }
}
