package com.sanketa.fabric.exception;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

/**
 * This class provides helper methods for logging exceptions with proper
 * context, MDC (Mapped Diagnostic Context) support, and structured logging.
 * 
 * <p><strong>Usage Examples:</strong></p>
 * <pre>{@code
 * // Log BaseException with automatic context
 * ExceptionLogger.logException(myException);
 * 
 * // Log with custom message
 * ExceptionLogger.logException(myException, "Failed to process request");
 * 
 * // Log with MDC context
 * ExceptionLogger.logWithContext(myException, 
 *     ErrorMetadata.builder()
 *         .correlationId("abc-123")
 *         .tenantId("101")
 *         .build());
 * }</pre>
 * 
 * @author mumei
 * @since 1.0.0
 */
@Slf4j
public final class ExceptionLogger {
    
    private ExceptionLogger() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Logs a BaseException using SLF4J with appropriate log level based on severity.
     * Automatically extracts and sets MDC context from exception metadata.
     * 
     * @param ex the exception to log
     */
    public static void logException(BaseException ex) {
        if (!ex.shouldLog()) {
            return;
        }
        
        setMDCContext(ex);
        try {
            logExceptionInternal(ex);
        } finally {
            clearMDCContext();
        }
    }
    
    /**
     * Logs a BaseException with a custom message.
     * 
     * @param ex the exception to log
     * @param customMessage the custom message to include
     */
    public static void logException(BaseException ex, String customMessage) {
        if (!ex.shouldLog()) {
            return;
        }
        
        setMDCContext(ex);
        try {
            logExceptionWithMessage(ex, customMessage);
        } finally {
            clearMDCContext();
        }
    }
    
    /**
     * Logs a BaseException with additional metadata context.
     * 
     * @param ex the exception to log
     * @param metadata additional metadata to include in MDC
     */
    public static void logWithContext(BaseException ex, ErrorMetadata metadata) {
        if (!ex.shouldLog()) {
            return;
        }
        
        setMDCContext(ex);
        setAdditionalMDCContext(metadata);
        try {
            logExceptionInternal(ex);
        } finally {
            clearMDCContext();
        }
    }
    
    /**
     * Logs a generic exception (not BaseException) with context.
     * 
     * @param ex the exception to log
     * @param errorCode a descriptive error code
     * @param severity the error severity
     */
    public static void logGenericException(Exception ex, String errorCode, ErrorSeverity severity) {
        MDC.put("errorCode", errorCode);
        MDC.put("errorSeverity", severity.name());
        
        try {
            switch (severity) {
                case CRITICAL:
                case HIGH:
                    log.error("Exception occurred: [{}] {}", errorCode, ex.getMessage(), ex);
                    break;
                case MEDIUM:
                    log.warn("Exception occurred: [{}] {}", errorCode, ex.getMessage(), ex);
                    break;
                case LOW:
                    log.debug("Exception occurred: [{}] {}", errorCode, ex.getMessage(), ex);
                    break;
            }
        } finally {
            clearMDCContext();
        }
    }
    
    /**
     * Logs an alert for critical/high severity exceptions.
     * This can be configured to forward to alerting systems via log appenders.
     * 
     * @param ex the exception to alert on
     */
    public static void logAlert(BaseException ex) {
        if (!ex.shouldAlert()) {
            return;
        }
        
        setMDCContext(ex);
        try {
            log.error("ALERT: [{}] {} | severity={} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                    ex.getCode(), ex.getMessage(), ex.getSeverity(), 
                    ex.getCorrelationId(), ex.getRequestId(), ex.getTenantId(), ex.getUserId());
        } finally {
            clearMDCContext();
        }
    }
    
    /**
     * Internal method to log exception based on severity.
     */
    private static void logExceptionInternal(BaseException ex) {
        ErrorSeverity severity = ex.getSeverity();
        String correlationId = ex.getCorrelationId();
        String requestId = ex.getRequestId();
        String tenantId = ex.getTenantId();
        String userId = ex.getUserId();
        
        switch (severity) {
            case CRITICAL:
                log.error("Exception occurred: [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        ex.getCode(), ex.getMessage(), correlationId, requestId, tenantId, userId, ex);
                break;
            case HIGH:
                log.error("Exception occurred: [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        ex.getCode(), ex.getMessage(), correlationId, requestId, tenantId, userId, ex);
                break;
            case MEDIUM:
                log.warn("Exception occurred: [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        ex.getCode(), ex.getMessage(), correlationId, requestId, tenantId, userId);
                break;
            case LOW:
                log.debug("Exception occurred: [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        ex.getCode(), ex.getMessage(), correlationId, requestId, tenantId, userId);
                break;
        }
    }
    
    /**
     * Internal method to log exception with custom message.
     */
    private static void logExceptionWithMessage(BaseException ex, String customMessage) {
        ErrorSeverity severity = ex.getSeverity();
        String correlationId = ex.getCorrelationId();
        String requestId = ex.getRequestId();
        String tenantId = ex.getTenantId();
        String userId = ex.getUserId();
        
        switch (severity) {
            case CRITICAL:
                log.error("{} | [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        customMessage, ex.getCode(), ex.getMessage(), 
                        correlationId, requestId, tenantId, userId, ex);
                break;
            case HIGH:
                log.error("{} | [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        customMessage, ex.getCode(), ex.getMessage(), 
                        correlationId, requestId, tenantId, userId, ex);
                break;
            case MEDIUM:
                log.warn("{} | [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        customMessage, ex.getCode(), ex.getMessage(), 
                        correlationId, requestId, tenantId, userId);
                break;
            case LOW:
                log.debug("{} | [{}] {} | correlationId={} | requestId={} | tenantId={} | userId={}", 
                        customMessage, ex.getCode(), ex.getMessage(), 
                        correlationId, requestId, tenantId, userId);
                break;
        }
    }
    
    /**
     * Sets MDC context from exception metadata.
     */
    private static void setMDCContext(BaseException ex) {
        if (ex.getCorrelationId() != null) {
            MDC.put("correlationId", ex.getCorrelationId());
        }
        if (ex.getRequestId() != null) {
            MDC.put("requestId", ex.getRequestId());
        }
        if (ex.getTenantId() != null) {
            MDC.put("tenantId", ex.getTenantId());
        }
        if (ex.getUserId() != null) {
            MDC.put("userId", ex.getUserId());
        }
        MDC.put("errorCode", ex.getCode());
        MDC.put("errorSeverity", ex.getSeverity().name());
    }
    
    /**
     * Sets additional MDC context from metadata.
     */
    private static void setAdditionalMDCContext(ErrorMetadata metadata) {
        if (metadata == null) {
            return;
        }
        
        if (metadata.getCorrelationId() != null) {
            MDC.put("correlationId", metadata.getCorrelationId());
        }
        if (metadata.getRequestId() != null) {
            MDC.put("requestId", metadata.getRequestId());
        }
        if (metadata.getTenantId() != null) {
            MDC.put("tenantId", metadata.getTenantId());
        }
        if (metadata.getUserId() != null) {
            MDC.put("userId", metadata.getUserId());
        }
        if (metadata.getOperation() != null) {
            MDC.put("operation", metadata.getOperation());
        }
    }
    
    /**
     * Clears MDC context.
     */
    private static void clearMDCContext() {
        MDC.clear();
    }
}

