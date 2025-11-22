package com.sanketa.fabric.cache.exception;

import com.sanketa.fabric.exception.BaseException;
import com.sanketa.fabric.exception.ErrorMetadata;

/**
 * Exception thrown for cache-related errors.
 * 
 * @author mumei
 */
public class CacheException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    
    public CacheException(CacheErrorCode errorCode) {
        super(errorCode);
    }
    
    public CacheException(CacheErrorCode errorCode, String message) {
        super(errorCode, message);
    }
    
    public CacheException(CacheErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }
    
    public CacheException(CacheErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
    
    public CacheException(CacheErrorCode errorCode, ErrorMetadata metadata) {
        super(errorCode, metadata);
    }
    
    public CacheException(CacheErrorCode errorCode, String message, ErrorMetadata metadata) {
        super(errorCode, message, metadata);
    }
    
    public CacheException(CacheErrorCode errorCode, String message, Throwable cause, ErrorMetadata metadata) {
        super(errorCode, message, cause, metadata);
    }
    
    @Override
    protected CacheException createCopyWithMetadata(ErrorMetadata metadata) {
        return new CacheException(
            (CacheErrorCode) getErrorCode(),
            getMessage(),
            getCause(),
            metadata
        );
    }
    
    /**
     * Check if this exception is retryable
     */
    public boolean isRetryable() {
        CacheErrorCode errorCode = (CacheErrorCode) getErrorCode();
        return errorCode == CacheErrorCode.REDIS_CONNECTION_FAILED ||
               errorCode == CacheErrorCode.REDIS_TIMEOUT ||
               errorCode == CacheErrorCode.CACHE_OPERATION_FAILED;
    }
}

