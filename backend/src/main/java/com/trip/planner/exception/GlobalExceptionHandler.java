package com.trip.planner.exception;

import com.trip.planner.dto.response.ApiResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResult<Void>> handleResourceNotFound(ResourceNotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResult.fail(404, e.getMessage()));
    }

    /**
     * 业务异常：根据 code 映射 HTTP 状态码。
     *  - 401 未登录 / Token 失效 → HTTP 401
     *  - 403 无权限 → HTTP 403
     *  - 404 资源不存在 → HTTP 404
     *  - 400 / 其他 → HTTP 400
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResult<Void>> handleBusiness(BusinessException e) {
        log.warn("Business error: code={}, msg={}", e.getCode(), e.getMessage());
        int code = e.getCode();
        HttpStatus httpStatus;
        if (code == 401) {
            httpStatus = HttpStatus.UNAUTHORIZED;
        } else if (code == 403) {
            httpStatus = HttpStatus.FORBIDDEN;
        } else if (code == 404) {
            httpStatus = HttpStatus.NOT_FOUND;
        } else {
            httpStatus = HttpStatus.BAD_REQUEST;
        }
        return ResponseEntity.status(httpStatus).body(ApiResult.fail(code, e.getMessage()));
    }

    @ExceptionHandler(AiGenerationException.class)
    public ResponseEntity<ApiResult<Void>> handleAiGeneration(AiGenerationException e) {
        log.error("AI generation error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResult.fail(500, "AI 生成失败: " + e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResult<Void>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        log.warn("Validation error: {}", msg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResult.fail(400, msg));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResult<Void>> handleNoHandler(NoHandlerFoundException e) {
        log.warn("No handler found: {}", e.getRequestURL());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResult.fail(404, "接口不存在: " + e.getRequestURL()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Void>> handleAll(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResult.fail(500, "服务器内部错误: " + e.getMessage()));
    }
}
