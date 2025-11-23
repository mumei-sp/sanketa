package com.sanketa.fabric.exception;

import org.springframework.http.HttpStatus;

/**
 * Each service/module should implement this interface to define its specific error codes.
 * This enables centralized error code management, internationalization, and consistent
 * error reporting across the entire application.
 * 
 * @author mumei
 */
public interface ErrorCode {
    
    /**
     * Returns the unique error code string identifier.
     * Format: SERVICE_MODULE_ERROR_TYPE (e.g., "TOKEN_VALIDATION_EXPIRED", "AUTH_UNAUTHORIZED")
     * 
     * @return the error code string
     */
    String getCode();
    
    /**
     * Returns the default error message for this error code.
     * This can be overridden by internationalization (i18n) mechanisms.
     * 
     * @return the default error message
     */
    String getMessage();
    
    /**
     * Returns the HTTP status code that should be returned for this error.
     * 
     * @return the HTTP status code
     */
    HttpStatus getHttpStatus();
    
    /**
     * Returns the severity level of this error.
     * Used for monitoring, alerting, and logging strategies.
     * 
     * @return the error severity
     */
    ErrorSeverity getSeverity();
    
    /**
     * Returns a user-friendly message that can be safely displayed to end users.
     * This should not contain sensitive information or technical details.
     * 
     * @return the user-friendly message
     */
    default String getUserMessage() {
        return getMessage();
    }
    
    /**
     * Indicates whether this error should be logged.
     * Some errors (e.g., expected validation errors) may not need logging.
     * 
     * @return true if this error should be logged, false otherwise
     */
    default boolean shouldLog() {
        return true;
    }
    
    /**
     * Indicates whether this error should trigger alerts/monitoring.
     * Critical errors should trigger alerts, while informational errors may not.
     * 
     * @return true if this error should trigger alerts, false otherwise
     */
    default boolean shouldAlert() {
        return getSeverity() == ErrorSeverity.CRITICAL || getSeverity() == ErrorSeverity.HIGH;
    }
}
