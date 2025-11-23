package com.sanketa.fabric.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error response DTO for REST API error responses.
 * This class provides a consistent structure for all error responses across the application.
 * 
 * @author mumei
 * @since 1.0.0
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    
    /**
     * Timestamp when the error occurred.
     */
    private Instant timestamp;
    
    /**
     * HTTP status code.
     */
    private Integer status;
    
    /**
     * HTTP status reason phrase.
     */
    private String error;
    
    /**
     * Application-specific error code.
     */
    private String code;
    
    /**
     * Technical error message (for developers/logging).
     */
    private String message;
    
    /**
     * User-friendly error message (safe to display to end users).
     */
    private String userMessage;
    
    /**
     * Request path where the error occurred.
     */
    private String path;
    
    /**
     * Correlation ID for distributed tracing.
     */
    private String correlationId;
    
    /**
     * Request ID for request tracking.
     */
    private String requestId;
    
    /**
     * Additional error metadata (tenant ID, user ID, operation context, etc.).
     */
    private Map<String, Object> metadata;
    
    /**
     * Validation errors (field-level errors for validation failures).
     */
    private Map<String, String> validationErrors;
    
    /**
     * Stack trace (only included in development/debug mode).
     */
    private String stackTrace;
}
