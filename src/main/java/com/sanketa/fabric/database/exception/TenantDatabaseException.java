package com.sanketa.fabric.database.exception;

import com.sanketa.fabric.exception.BaseException;
import com.sanketa.fabric.exception.ErrorCode;
import com.sanketa.fabric.exception.ErrorMetadata;

import java.io.Serial;

/**
 * Base exception for all tenant database routing errors.
 * 
 * @author mumei
 */
public class TenantDatabaseException extends BaseException {
    
    @Serial
    private static final long serialVersionUID = 1L;
    
    public TenantDatabaseException(DatabaseErrorCode errorCode) {
        super(errorCode);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, String message) {
        super(errorCode, message);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, ErrorMetadata metadata) {
        super(errorCode, metadata);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, String message, ErrorMetadata metadata) {
        super(errorCode, message, metadata);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, Throwable cause, ErrorMetadata metadata) {
        super(errorCode, cause, metadata);
    }
    
    public TenantDatabaseException(DatabaseErrorCode errorCode, String message, Throwable cause, ErrorMetadata metadata) {
        super(errorCode, message, cause, metadata);
    }
    
    @Override
    protected BaseException createCopyWithMetadata(ErrorMetadata metadata) {
        return new TenantDatabaseException(
            (DatabaseErrorCode) getErrorCode(), 
            getMessage(), 
            getCause(), 
            metadata
        );
    }
}

