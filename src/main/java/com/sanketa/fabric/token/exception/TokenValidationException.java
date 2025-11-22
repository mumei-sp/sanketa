package com.sanketa.fabric.token.exception;

import com.sanketa.fabric.exception.BaseException;
import com.sanketa.fabric.exception.ErrorMetadata;

/**
 * Exception thrown when token validation fails.
 * 
 * This exception extends BaseException to provide structured error handling
 * with error codes, metadata, and consistent error reporting.
 * 
 * @author mumei
 */
public class TokenValidationException extends BaseException {

    /**
     * Constructs a new TokenValidationException with the specified error code and message.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     */
    public TokenValidationException(TokenErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Constructs a new TokenValidationException with the specified error code, message, and cause.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    public TokenValidationException(TokenErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
    
    /**
     * Constructs a new TokenValidationException with the specified error code and metadata.
     * 
     * @param errorCode the token error code
     * @param metadata the error metadata containing contextual information
     */
    public TokenValidationException(TokenErrorCode errorCode, ErrorMetadata metadata) {
        super(errorCode, metadata);
    }

    /**
     * Constructs a new TokenValidationException with the specified error code, message, cause, and metadata.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     * @param metadata the error metadata containing contextual information
     */
    public TokenValidationException(TokenErrorCode errorCode, String message, Throwable cause, ErrorMetadata metadata) {
        super(errorCode, message, cause, metadata);
    }
    
    @Override
    protected BaseException createCopyWithMetadata(ErrorMetadata metadata) {
        return new TokenValidationException(
                (TokenErrorCode) getErrorCode(),
                getMessage(),
                getCause(),
                metadata
        );
    }
}
