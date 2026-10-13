package com.trip.planner.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trip.planner.constant.ModelConstants;
import com.trip.planner.config.AppProperties;
import com.trip.planner.dto.ai.AiGenerateResult;
import com.trip.planner.dto.ai.AiItineraryDto;
import com.trip.planner.entity.AiGeneration;
import com.trip.planner.exception.AiGenerationException;
import com.trip.planner.exception.BusinessException;
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

import java.util.List;

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
        return generateItinerary(userRequirement, null);
    }

    @Override
    public AiGenerateResult generateItinerary(String userRequirement, String model) {
        AppProperties.Ai ai = appProperties.getAi();
        String prompt = PromptBuilder.buildSystemPrompt() + "\n\n" + PromptBuilder.buildUserPrompt(userRequirement);

        // 解析实际使用的模型：空 → 默认；非白名单 → 400
        boolean degraded = false;
        String actualModel = model;
        if (actualModel == null || actualModel.trim().isEmpty()) {
            actualModel = ModelConstants.DEFAULT_TEXT_MODEL;
        } else if (!ModelConstants.isValidModel(actualModel)) {
            throw new BusinessException(400, "不支持的模型: " + actualModel);
        }

        // 写入 PENDING 记录
        AiGeneration record = new AiGeneration();
        record.setInputType("TEXT");
        record.setInputContent(userRequirement);
        record.setModelName(actualModel);
        record.setPrompt(prompt);
        record.setStatus("PENDING");
        aiGenerationMapper.insert(record);

        try {
            String rawOutput;
            try {
                rawOutput = callArkApi(ai, actualModel, prompt);
            } catch (org.springframework.web.client.RestClientException e) {
                // 模型可能不可用（4xx/超时/5xx），降级到默认模型重试
                if (!actualModel.equals(ModelConstants.DEFAULT_TEXT_MODEL)) {
                    log.warn("Model {} call failed ({}), degrading to default {}",
                            actualModel, e.getMessage(), ModelConstants.DEFAULT_TEXT_MODEL);
                    degraded = true;
                    actualModel = ModelConstants.DEFAULT_TEXT_MODEL;
                    // DB 记录保留原始请求模型名用于审计；AiGenerateResult.modelUsed 反映实际使用的模型
                    rawOutput = callArkApi(ai, actualModel, prompt);
                } else {
                    throw e;
                }
            }
            record.setOutputJson(rawOutput);
            AiItineraryDto itinerary = JsonExtractor.extract(rawOutput, AiItineraryDto.class);
            validate(itinerary);
            aiGenerationMapper.updateStatus(record.getId(), "SUCCESS", null, null);
            log.info("AI generation SUCCESS, recordId={}, model={}, degraded={}",
                    record.getId(), actualModel, degraded);
            return new AiGenerateResult(record.getId(), itinerary, degraded, actualModel);
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("AI generation FAILED (network), recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw new AiGenerationException("AI 调用失败（网络错误）: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("AI generation FAILED, recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw e instanceof AiGenerationException
                    ? (AiGenerationException) e
                    : new AiGenerationException("AI 调用失败: " + e.getMessage(), e);
        }
    }

    @Override
    public AiGenerateResult recognizeItineraryFromImages(List<String> imageDataUrls, String model) {
        AppProperties.Ai ai = appProperties.getAi();
        int imageCount = imageDataUrls == null ? 0 : imageDataUrls.size();
        String prompt = PromptBuilder.buildImageSystemPrompt() + "\n\n"
                + PromptBuilder.buildImageUserPrompt(imageCount);

        // 解析实际使用的模型：空 → 默认识图模型；非识图白名单 → 400
        boolean degraded = false;
        String actualModel = model;
        if (actualModel == null || actualModel.trim().isEmpty()) {
            actualModel = ModelConstants.DEFAULT_IMAGE_MODEL;
        } else if (!ModelConstants.isValidImageModel(actualModel)) {
            throw new BusinessException(400, "不支持的识图模型: " + actualModel);
        }

        // 写入 PENDING 记录
        AiGeneration record = new AiGeneration();
        record.setInputType("IMAGE");
        record.setInputContent("共 " + imageCount + " 张图片");
        record.setModelName(actualModel);
        record.setPrompt(prompt);
        record.setStatus("PENDING");
        aiGenerationMapper.insert(record);

        try {
            // 构造 user 消息 content：首个文本提示 + N 个图片片段
            ArrayNode content = MAPPER.createArrayNode();
            ObjectNode textPart = content.addObject();
            textPart.put("type", "input_text");
            textPart.put("text", prompt);
            if (imageDataUrls != null) {
                for (String dataUrl : imageDataUrls) {
                    ObjectNode imgPart = content.addObject();
                    imgPart.put("type", "input_image");
                    imgPart.put("image_url", dataUrl);
                }
            }

            String rawOutput;
            try {
                rawOutput = callArkApiWithContent(ai, actualModel, content);
            } catch (org.springframework.web.client.RestClientException e) {
                // 识图模型可能不可用，降级到默认识图模型重试
                if (!actualModel.equals(ModelConstants.DEFAULT_IMAGE_MODEL)) {
                    log.warn("Image model {} call failed ({}), degrading to default {}",
                            actualModel, e.getMessage(), ModelConstants.DEFAULT_IMAGE_MODEL);
                    degraded = true;
                    actualModel = ModelConstants.DEFAULT_IMAGE_MODEL;
                    rawOutput = callArkApiWithContent(ai, actualModel, content);
                } else {
                    throw e;
                }
            }
            record.setOutputJson(rawOutput);
            AiItineraryDto itinerary = JsonExtractor.extract(rawOutput, AiItineraryDto.class);
            validate(itinerary);
            aiGenerationMapper.updateStatus(record.getId(), "SUCCESS", null, null);
            log.info("Image recognition SUCCESS, recordId={}, model={}, images={}, degraded={}",
                    record.getId(), actualModel, imageCount, degraded);
            return new AiGenerateResult(record.getId(), itinerary, degraded, actualModel);
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("Image recognition FAILED (network), recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw new AiGenerationException("识图调用失败（网络错误）: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Image recognition FAILED, recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw e instanceof AiGenerationException
                    ? (AiGenerationException) e
                    : new AiGenerationException("识图调用失败: " + e.getMessage(), e);
        }
    }

    /**
     * Phase 18：节点 AI 智能填充。thinking disabled + 紧凑 JSON + 截断修复复用 JsonExtractor。
     */
    @Override
    public com.trip.planner.dto.response.NodeEnrichResponse enrichNode(String name, String city, String model) {
        AppProperties.Ai ai = appProperties.getAi();
        String prompt = PromptBuilder.buildNodeEnrichPrompt(name, city);

        // 解析实际使用的模型：空 → 默认文本模型；非文本白名单 → 400
        boolean degraded = false;
        String actualModel = model;
        if (actualModel == null || actualModel.trim().isEmpty()) {
            actualModel = ModelConstants.DEFAULT_TEXT_MODEL;
        } else if (!ModelConstants.isValidTextModel(actualModel)) {
            throw new BusinessException(400, "不支持的模型: " + actualModel);
        }

        // 写入 PENDING 记录（input_content 统一加 [NODE_ENRICH] 前缀便于区分场景）
        AiGeneration record = new AiGeneration();
        record.setInputType("TEXT");
        record.setInputContent("[NODE_ENRICH] " + name);
        record.setModelName(actualModel);
        record.setPrompt(prompt);
        record.setStatus("PENDING");
        aiGenerationMapper.insert(record);

        try {
            String rawOutput;
            try {
                rawOutput = callArkApi(ai, actualModel, prompt);
            } catch (org.springframework.web.client.RestClientException e) {
                // 文本模型可能不可用，降级到默认文本模型重试
                if (!actualModel.equals(ModelConstants.DEFAULT_TEXT_MODEL)) {
                    log.warn("Enrich model {} call failed ({}), degrading to default {}",
                            actualModel, e.getMessage(), ModelConstants.DEFAULT_TEXT_MODEL);
                    degraded = true;
                    actualModel = ModelConstants.DEFAULT_TEXT_MODEL;
                    rawOutput = callArkApi(ai, actualModel, prompt);
                } else {
                    throw e;
                }
            }
            record.setOutputJson(rawOutput);
            com.trip.planner.dto.ai.AiNodeEnrichDto dto =
                    JsonExtractor.extract(rawOutput, com.trip.planner.dto.ai.AiNodeEnrichDto.class);
            aiGenerationMapper.updateStatus(record.getId(), "SUCCESS", null, null);
            log.info("Node enrich SUCCESS, recordId={}, name={}, model={}, degraded={}",
                    record.getId(), name, actualModel, degraded);
            return com.trip.planner.dto.response.NodeEnrichResponse.builder()
                    .placeType(dto.getPlace_type())
                    .suggestedDuration(dto.getSuggested_duration())
                    .highlight(dto.getHighlight())
                    .description(dto.getDescription())
                    .openTime(dto.getOpen_time())
                    .ticketInfo(dto.getTicket_info())
                    .estimatedCost(dto.getEstimated_cost())
                    .modelUsed(actualModel)
                    .build();
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("Node enrich FAILED (network), recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw new AiGenerationException("AI 填充调用失败（网络错误）: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Node enrich FAILED, recordId={}", record.getId(), e);
            aiGenerationMapper.updateStatus(record.getId(), "FAILED", e.getMessage(), null);
            throw e instanceof AiGenerationException
                    ? (AiGenerationException) e
                    : new AiGenerationException("AI 填充调用失败: " + e.getMessage(), e);
        }
    }

    private String callArkApi(AppProperties.Ai ai, String model, String prompt) {
        ArrayNode content = MAPPER.createArrayNode();
        ObjectNode textPart = content.addObject();
        textPart.put("type", "input_text");
        textPart.put("text", prompt);
        return callArkApiWithContent(ai, model, content);
    }

    /**
     * 调用 Ark responses API，content 为一条 user 消息的内容片段数组（文本 + 可选图片）。
     * 统一关闭思考链（"thinking":{"type":"disabled"}）并限制 max_output_tokens 以缩短响应耗时。
     */
    private String callArkApiWithContent(AppProperties.Ai ai, String model, ArrayNode content) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("model", model);
        body.put("stream", false);
        body.putObject("thinking").put("type", "disabled");
        if (ai.getMaxOutputTokens() > 0) {
            body.put("max_output_tokens", ai.getMaxOutputTokens());
        }

        ArrayNode input = body.putArray("input");
        ObjectNode userMsg = input.addObject();
        userMsg.put("role", "user");
        userMsg.set("content", content);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(ai.getApiKey());

        log.info("Calling Ark API, model={}", model);
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
