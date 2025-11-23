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
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Generic global exception handler for the application.
 * Provides centralized exception processing and consistent error response formatting.
 * 
 * @author mumei
 * @since 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex, WebRequest request) {
        ExceptionLogger.logException(ex);
        ExceptionLogger.logAlert(ex);
        
        ErrorMetadata metadata = ex.getMetadata();
        Map<String, Object> metadataMap = (metadata != null && !metadata.isEmpty()) 
            ? metadata.getAll() 
            : null;
        
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(ex.getTimestamp())
                .status(ex.getHttpStatus().value())
                .error(ex.getHttpStatus().getReasonPhrase())
                .code(ex.getCode())
                .message(ex.getMessage())
                .userMessage(ex.getUserMessage())
                .path(getRequestPath(request))
                .correlationId(ex.getCorrelationId())
                .requestId(ex.getRequestId())
                .metadata(metadataMap)
                .build();
        
        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }
    
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorResponse> handleValidationException(BindException ex, WebRequest request) {
        Map<String, String> validationErrors = extractValidationErrors(ex);
        
        log.warn("Validation error: {}", validationErrors);
        
        ErrorResponse response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "VALIDATION_ERROR",
            "Validation failed",
            "Please check your input and try again",
            getRequestPath(request),
            null,
            validationErrors
        );
        
        return ResponseEntity.badRequest().body(response);
    }
    
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, WebRequest request) {
        
        log.warn("Malformed request: {}", ex.getMessage());
        
        ErrorResponse response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "MALFORMED_REQUEST",
            "Request body is malformed or unreadable",
            "Invalid request format. Please check your request body.",
            getRequestPath(request),
            null,
            null
        );
        
        return ResponseEntity.badRequest().body(response);
    }
    
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        
        String expectedType = ex.getRequiredType() != null 
            ? ex.getRequiredType().getSimpleName() 
            : "unknown";
        String message = String.format("Parameter '%s' has invalid type. Expected: %s", 
            ex.getName(), expectedType);
        
        log.warn("Type mismatch error: {}", ex.getMessage());
        
        ErrorResponse response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "TYPE_MISMATCH",
            message,
            "Invalid parameter type",
            getRequestPath(request),
            null,
            null
        );
        
        return ResponseEntity.badRequest().body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unhandled exception occurred", ex);
        
        ErrorResponse response = buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
            "We're sorry, but something went wrong. Please try again later.",
            getRequestPath(request),
            null,
            null
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    private Map<String, String> extractValidationErrors(BindException ex) {
        return ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));
    }
    
    private ErrorResponse buildErrorResponse(
            HttpStatus status,
            String code,
            String message,
            String userMessage,
            String path,
            Map<String, Object> metadata,
            Map<String, String> validationErrors) {
        
        return ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .userMessage(userMessage)
                .path(path)
                .metadata(metadata)
                .validationErrors(validationErrors)
                .build();
    }
    
    private String getRequestPath(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            return ((ServletWebRequest) request).getRequest().getRequestURI();
        }
        String description = request.getDescription(false);
        return description.replace("uri=", "");
    }
}
