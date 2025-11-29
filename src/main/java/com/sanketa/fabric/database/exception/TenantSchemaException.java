package com.sanketa.fabric.database.exception;

import com.sanketa.fabric.exception.ErrorMetadata;

import java.io.Serial;

/**
 * Exception thrown when tenant schema operations fail.
 * 
 * @author mumei
 */
public class TenantSchemaException extends TenantDatabaseException {
    
    @Serial
    private static final long serialVersionUID = 1L;
    
    public TenantSchemaException() {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND);
    }
    
    public TenantSchemaException(String message) {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND, message);
    }
    
    public TenantSchemaException(Throwable cause) {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND, cause);
    }
    
    public TenantSchemaException(String message, Throwable cause) {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND, message, cause);
    }
    
    public TenantSchemaException(ErrorMetadata metadata) {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND, metadata);
    }
    
    public TenantSchemaException(String message, ErrorMetadata metadata) {
        super(DatabaseErrorCode.SCHEMA_NOT_FOUND, message, metadata);
    }
    
    /**
     * Create exception with specific error code and message.
     */
    public TenantSchemaException(DatabaseErrorCode errorCode, String message) {
        super(errorCode, message);
    }
    
    /**
     * Create exception for schema switch failure with specific error code.
     */
    public TenantSchemaException(DatabaseErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
    
    /**
     * Create exception for schema switch failure.
     */
    public static TenantSchemaException switchFailed(String schemaName, Throwable cause) {
        return new TenantSchemaException(
            DatabaseErrorCode.SCHEMA_SWITCH_FAILED,
            "Failed to switch to schema: " + schemaName,
            cause
        );
    }
}
