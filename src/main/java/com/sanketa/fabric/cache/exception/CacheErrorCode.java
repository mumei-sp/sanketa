package com.sanketa.fabric.cache.exception;

import com.sanketa.fabric.exception.ErrorCode;
import com.sanketa.fabric.exception.ErrorSeverity;
import org.springframework.http.HttpStatus;

/**
 * Error codes for cache operations.
 * 
 * @author mumei
 */
public enum CacheErrorCode implements ErrorCode {
    
    /**
     * Redis connection failure
     */
    REDIS_CONNECTION_FAILED(
        "CACHE_REDIS_CONNECTION_FAILED",
        "Failed to connect to Redis",
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorSeverity.HIGH,
        "Cache service is temporarily unavailable. Please try again later."
    ),
    
    /**
     * Redis operation timeout
     */
    REDIS_TIMEOUT(
        "CACHE_REDIS_TIMEOUT",
        "Redis operation timed out",
        HttpStatus.REQUEST_TIMEOUT,
        ErrorSeverity.MEDIUM,
        "Cache operation took too long. Please try again."
    ),
    
    /**
     * Redis serialization error
     */
    REDIS_SERIALIZATION_ERROR(
        "CACHE_REDIS_SERIALIZATION_ERROR",
        "Failed to serialize/deserialize cache value",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorSeverity.MEDIUM,
        "An error occurred while processing cached data."
    ),
    
    /**
     * Cache key not found (non-critical, usually handled gracefully)
     */
    CACHE_KEY_NOT_FOUND(
        "CACHE_KEY_NOT_FOUND",
        "Cache key not found",
        HttpStatus.NOT_FOUND,
        ErrorSeverity.LOW,
        "Requested data not found in cache."
    ),
    
    /**
     * Cache operation failed
     */
    CACHE_OPERATION_FAILED(
        "CACHE_OPERATION_FAILED",
        "Cache operation failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorSeverity.MEDIUM,
        "An error occurred while accessing cache."
    ),
    
    /**
     * Cache configuration error
     */
    CACHE_CONFIGURATION_ERROR(
        "CACHE_CONFIGURATION_ERROR",
        "Cache configuration is invalid",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorSeverity.HIGH,
        "Cache service is misconfigured."
    ),
    
    /**
     * Cache type mismatch
     */
    CACHE_TYPE_MISMATCH(
        "CACHE_TYPE_MISMATCH",
        "Cache type mismatch",
        HttpStatus.BAD_REQUEST,
        ErrorSeverity.LOW,
        "Invalid cache type specified."
    );
    
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
    private final ErrorSeverity severity;
    private final String userMessage;
    
    CacheErrorCode(String code, String message, HttpStatus httpStatus, 
                  ErrorSeverity severity, String userMessage) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
        this.severity = severity;
        this.userMessage = userMessage;
    }
    
    @Override
    public String getCode() {
        return code;
    }
    
    @Override
    public String getMessage() {
        return message;
    }
    
    @Override
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
    
    @Override
    public ErrorSeverity getSeverity() {
        return severity;
    }
    
    @Override
    public String getUserMessage() {
        return userMessage;
    }
    
    @Override
    public boolean shouldLog() {
        // Don't log cache misses (CACHE_KEY_NOT_FOUND)
        return this != CACHE_KEY_NOT_FOUND;
    }
}

