package com.sanketa.fabric.database.exception;

import com.sanketa.fabric.exception.ErrorMetadata;

import java.io.Serial;

/**
 * Exception thrown when tenant context is missing from ThreadLocal.
 * 
 * @author mumei
 */
public class TenantContextMissingException extends TenantDatabaseException {
    
    @Serial
    private static final long serialVersionUID = 1L;
    
    public TenantContextMissingException() {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING);
    }
    
    public TenantContextMissingException(String message) {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING, message);
    }
    
    public TenantContextMissingException(Throwable cause) {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING, cause);
    }
    
    public TenantContextMissingException(String message, Throwable cause) {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING, message, cause);
    }
    
    public TenantContextMissingException(ErrorMetadata metadata) {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING, metadata);
    }
    
    public TenantContextMissingException(String message, ErrorMetadata metadata) {
        super(DatabaseErrorCode.TENANT_CONTEXT_MISSING, message, metadata);
    }
}

