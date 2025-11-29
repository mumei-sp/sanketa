package com.sanketa.fabric.database.exception;

import com.sanketa.fabric.exception.ErrorCode;
import com.sanketa.fabric.exception.ErrorSeverity;
import org.springframework.http.HttpStatus;

/**
 * Error codes for database routing and tenant database operations.
 * 
 * @author mumei
 */
public enum DatabaseErrorCode implements ErrorCode {
    
    /**
     * Tenant context is missing from ThreadLocal.
     */
    TENANT_CONTEXT_MISSING(
            "DATABASE_TENANT_CONTEXT_MISSING",
            "Tenant context is not available in current thread",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database routing error. Please contact support."
    ),
    
    /**
     * Failed to establish connection to tenant database.
     */
    CONNECTION_FAILED(
            "DATABASE_CONNECTION_FAILED",
            "Failed to establish connection to tenant database",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database connection error. Please try again."
    ),
    
    /**
     * Connection string is invalid or malformed.
     */
    CONNECTION_STRING_INVALID(
            "DATABASE_CONNECTION_STRING_INVALID",
            "Invalid or malformed connection string",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database configuration error. Please contact support."
    ),
    
    /**
     * Tenant schema does not exist.
     */
    SCHEMA_NOT_FOUND(
            "DATABASE_SCHEMA_NOT_FOUND",
            "Tenant schema does not exist",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database schema error. Please contact support."
    ),
    
    /**
     * Failed to switch to tenant schema.
     */
    SCHEMA_SWITCH_FAILED(
            "DATABASE_SCHEMA_SWITCH_FAILED",
            "Failed to switch to tenant schema",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database routing error. Please contact support."
    ),
    
    /**
     * Database instance is not healthy.
     */
    DATABASE_UNHEALTHY(
            "DATABASE_UNHEALTHY",
            "Database instance is not healthy",
            HttpStatus.SERVICE_UNAVAILABLE,
            ErrorSeverity.HIGH,
            "Database service is temporarily unavailable. Please try again later."
    ),
    
    /**
     * Failed to create DataSource for database instance.
     */
    DATASOURCE_CREATION_FAILED(
            "DATABASE_DATASOURCE_CREATION_FAILED",
            "Failed to create DataSource for database instance",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.CRITICAL,
            "Database service error. Please contact support."
    ),
    
    /**
     * Database type is not supported.
     */
    DATABASE_TYPE_UNSUPPORTED(
            "DATABASE_TYPE_UNSUPPORTED",
            "Database type is not supported",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database configuration error. Please contact support."
    ),
    
    /**
     * Connection pool is exhausted.
     */
    CONNECTION_POOL_EXHAUSTED(
            "DATABASE_CONNECTION_POOL_EXHAUSTED",
            "Connection pool is exhausted",
            HttpStatus.SERVICE_UNAVAILABLE,
            ErrorSeverity.MEDIUM,
            "Database is temporarily busy. Please try again later."
    ),
    
    /**
     * Connection validation failed.
     */
    CONNECTION_VALIDATION_FAILED(
            "DATABASE_CONNECTION_VALIDATION_FAILED",
            "Connection validation failed",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.MEDIUM,
            "Database connection error. Please try again."
    ),
    
    /**
     * Transaction management error.
     */
    TRANSACTION_ERROR(
            "DATABASE_TRANSACTION_ERROR",
            "Transaction management error",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Database transaction error. Please try again."
    );
    
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
    private final ErrorSeverity severity;
    private final String userMessage;
    
    DatabaseErrorCode(String code, String message, HttpStatus httpStatus, 
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
}

