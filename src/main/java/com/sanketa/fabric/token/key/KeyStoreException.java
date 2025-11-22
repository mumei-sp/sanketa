package com.sanketa.fabric.token.key;

import com.sanketa.fabric.exception.BaseException;
import com.sanketa.fabric.exception.ErrorMetadata;
import com.sanketa.fabric.token.TokenErrorCode;

/**
 * Exception thrown when key store operations fail.
 */
public class KeyStoreException extends BaseException {

    /**
     * Constructs a new KeyStoreException with the specified error code and message.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     */
    public KeyStoreException(TokenErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Constructs a new KeyStoreException with the specified error code, message, and cause.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    public KeyStoreException(TokenErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }

    /**
     * Constructs a new KeyStoreException with the specified error code, message, cause, and metadata.
     * 
     * @param errorCode the token error code
     * @param message the detail message (overrides the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     * @param metadata the error metadata containing contextual information
     */
    public KeyStoreException(TokenErrorCode errorCode, String message, Throwable cause, ErrorMetadata metadata) {
        super(errorCode, message, cause, metadata);
    }
}
