package com.sanketa.fabric.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for the entire application.
 * 
 * This handler provides centralized exception processing and consistent error response
 * formatting across all REST endpoints. It handles:
 * 
 * <ul>
 *   <li>Application-specific BaseException instances</li>
 *   <li>Spring validation exceptions</li>
 *   <li>HTTP message parsing errors</li>
 *   <li>Generic exceptions as fallback</li>
 * </ul>
 * 
 * <p><strong>Error Response Format:</strong></p>
 * <pre>{@code
 * {
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "code": "TOKEN_VALIDATION_EXPIRED",
 *   "message": "Token has expired",
 *   "userMessage": "Your session has expired. Please log in again.",
 *   "path": "/api/v1/token/validate",
 *   "correlationId": "abc-123-def",
 *   "metadata": {
 *     "tenantId": "101",
 *     "userId": "12345"
 *   }
 * }
 * }</pre>
 * 
 * @author mumei
 * @since 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * Handles all BaseException instances (application-specific exceptions).
     * 
     * @param ex the BaseException instance
     * @param request the HTTP request (injected by Spring)
     * @return the error response entity
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex, WebRequest request) {
        // Log exception using SLF4J utility (handles MDC context automatically)
        ExceptionLogger.logException(ex);
        
        // Trigger alerts if configured (uses SLF4J for alert logging)
        ExceptionLogger.logAlert(ex);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(ex.getTimestamp())
                .status(ex.getHttpStatus().value())
                .error(ex.getHttpStatus().getReasonPhrase())
                .code(ex.getCode())
                .message(ex.getMessage())
                .userMessage(ex.getUserMessage())
                .path(getRequestPath(request))
                .correlationId(ex.getCorrelationId())
                .requestId(ex.getRequestId())
                .metadata(buildMetadataMap(ex))
                .build();
        
        return ResponseEntity.status(ex.getHttpStatus()).body(errorResponse);
    }
    
    /**
     * Handles Spring validation errors (MethodArgumentNotValidException).
     * 
     * @param ex the validation exception
     * @param request the HTTP request
     * @return the error response entity
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        Map<String, String> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("VALIDATION_ERROR")
                .message("Validation failed")
                .userMessage("Please check your input and try again")
                .path(getRequestPath(request))
                .validationErrors(validationErrors)
                .build();
        
        log.warn("Validation error: {}", validationErrors);
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * Handles Spring binding errors (BindException).
     * 
     * @param ex the binding exception
     * @param request the HTTP request
     * @return the error response entity
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException ex, WebRequest request) {
        
        Map<String, String> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("BINDING_ERROR")
                .message("Request binding failed")
                .userMessage("Invalid request format")
                .path(getRequestPath(request))
                .validationErrors(validationErrors)
                .build();
        
        log.warn("Binding error: {}", validationErrors);
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * Handles HTTP message parsing errors.
     * 
     * @param ex the message not readable exception
     * @param request the HTTP request
     * @return the error response entity
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, WebRequest request) {
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("MALFORMED_REQUEST")
                .message("Request body is malformed or unreadable")
                .userMessage("Invalid request format. Please check your request body.")
                .path(getRequestPath(request))
                .build();
        
        log.warn("Malformed request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * Handles method argument type mismatch errors.
     * 
     * @param ex the type mismatch exception
     * @param request the HTTP request
     * @return the error response entity
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("TYPE_MISMATCH")
                .message(String.format("Parameter '%s' has invalid type. Expected: %s", 
                        ex.getName(), ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown"))
                .userMessage("Invalid parameter type")
                .path(getRequestPath(request))
                .build();
        
        log.warn("Type mismatch error: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * Handles all other unhandled exceptions as a fallback.
     * 
     * @param ex the exception
     * @param request the HTTP request
     * @return the error response entity
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {
        
        log.error("Unhandled exception occurred", ex);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .code("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred")
                .userMessage("We're sorry, but something went wrong. Please try again later.")
                .path(getRequestPath(request))
                .build();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
    
    /**
     * Builds a metadata map from exception metadata.
     * 
     * @param ex the BaseException
     * @return the metadata map
     */
    private Map<String, Object> buildMetadataMap(BaseException ex) {
        Map<String, Object> metadataMap = new HashMap<>();
        ErrorMetadata metadata = ex.getMetadata();
        
        if (metadata != null) {
            if (metadata.getTenantId() != null) {
                metadataMap.put("tenantId", metadata.getTenantId());
            }
            if (metadata.getUserId() != null) {
                metadataMap.put("userId", metadata.getUserId());
            }
            if (metadata.getOperation() != null) {
                metadataMap.put("operation", metadata.getOperation());
            }
            if (metadata.hasAttributes()) {
                metadataMap.putAll(metadata.getAttributes());
            }
        }
        
        return metadataMap.isEmpty() ? null : metadataMap;
    }
    
    /**
     * Gets the request path from the WebRequest.
     * 
     * @param request the WebRequest
     * @return the request path
     */
    private String getRequestPath(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            return ((ServletWebRequest) request).getRequest().getRequestURI();
        }
        String description = request.getDescription(false);
        return description.replace("uri=", "");
    }
    
}

