package com.trip.planner.exception;

public class AiGenerationException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public AiGenerationException(String message) {
        super(message);
    }

    public AiGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
