package com.sanketa.fabric.database.exception;

import com.sanketa.fabric.exception.ErrorMetadata;

import java.io.Serial;

/**
 * Exception thrown when connection to tenant database fails.
 * 
 * @author mumei
 */
public class TenantConnectionException extends TenantDatabaseException {
    
    @Serial
    private static final long serialVersionUID = 1L;
    
    public TenantConnectionException() {
        super(DatabaseErrorCode.CONNECTION_FAILED);
    }
    
    public TenantConnectionException(String message) {
        super(DatabaseErrorCode.CONNECTION_FAILED, message);
    }
    
    public TenantConnectionException(Throwable cause) {
        super(DatabaseErrorCode.CONNECTION_FAILED, cause);
    }
    
    public TenantConnectionException(String message, Throwable cause) {
        super(DatabaseErrorCode.CONNECTION_FAILED, message, cause);
    }
    
    public TenantConnectionException(ErrorMetadata metadata) {
        super(DatabaseErrorCode.CONNECTION_FAILED, metadata);
    }
    
    public TenantConnectionException(String message, ErrorMetadata metadata) {
        super(DatabaseErrorCode.CONNECTION_FAILED, message, metadata);
    }
    
    public TenantConnectionException(String message, Throwable cause, ErrorMetadata metadata) {
        super(DatabaseErrorCode.CONNECTION_FAILED, message, cause, metadata);
    }
}

