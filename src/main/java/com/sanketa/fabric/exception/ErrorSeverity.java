package com.sanketa.fabric.exception;

/**
 * Enumeration representing the severity level of an error.
 * Used for error classification, monitoring, alerting, and logging strategies.
 * 
 * @author mumei
 */
public enum ErrorSeverity {
    /**
     * Low severity - Informational errors that don't affect functionality.
     * Examples: Deprecated API usage, non-critical validation warnings.
     */
    LOW,
    
    /**
     * Medium severity - Errors that affect functionality but have fallback mechanisms.
     * Examples: Retryable failures, degraded service modes.
     */
    MEDIUM,
    
    /**
     * High severity - Critical errors that significantly impact functionality.
     * Examples: Authentication failures, authorization violations, data integrity issues.
     */
    HIGH,
    
    /**
     * Critical severity - System-level errors that require immediate attention.
     * Examples: System failures, security breaches, data loss scenarios.
     */
    CRITICAL
}

