package com.sanketa.fabric.token.exception;

import com.sanketa.fabric.exception.ErrorCode;
import com.sanketa.fabric.exception.ErrorSeverity;
import org.springframework.http.HttpStatus;

/**
 * Error codes for token-related operations.
 * 
 * This enum defines all possible error scenarios in the token service,
 * providing structured error identification and consistent error handling.
 * 
 * @author mumei
 */
public enum TokenErrorCode implements ErrorCode {
    
    /**
     * Token is missing from the request.
     */
    TOKEN_MISSING(
            "TOKEN_MISSING",
            "Tenant Context Token is missing from request",
            HttpStatus.UNAUTHORIZED,
            ErrorSeverity.MEDIUM,
            "Please provide a valid authentication token"
    ),
    
    /**
     * Token has expired.
     */
    TOKEN_EXPIRED(
            "TOKEN_EXPIRED",
            "Token has expired",
            HttpStatus.UNAUTHORIZED,
            ErrorSeverity.MEDIUM,
            "Your session has expired. Please log in again."
    ),
    
    /**
     * Token signature verification failed.
     */
    TOKEN_INVALID_SIGNATURE(
            "TOKEN_INVALID_SIGNATURE",
            "Token signature verification failed",
            HttpStatus.UNAUTHORIZED,
            ErrorSeverity.HIGH,
            "Invalid authentication token. Please log in again."
    ),
    
    /**
     * Token format is invalid or malformed.
     */
    TOKEN_INVALID_FORMAT(
            "TOKEN_INVALID_FORMAT",
            "Token format is invalid",
            HttpStatus.UNAUTHORIZED,
            ErrorSeverity.MEDIUM,
            "Invalid token format"
    ),
    
    /**
     * Token parsing failed.
     */
    TOKEN_PARSE_ERROR(
            "TOKEN_PARSE_ERROR",
            "Failed to parse token",
            HttpStatus.UNAUTHORIZED,
            ErrorSeverity.MEDIUM,
            "Invalid token format"
    ),
    
    /**
     * Verification key not found for the token's key ID.
     */
    TOKEN_KEY_NOT_FOUND(
            "TOKEN_KEY_NOT_FOUND",
            "Verification key not found for token",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Authentication service error. Please contact support."
    ),
    
    /**
     * Token generation failed.
     */
    TOKEN_GENERATION_FAILED(
            "TOKEN_GENERATION_FAILED",
            "Failed to generate token",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Unable to generate authentication token. Please try again."
    ),
    
    /**
     * User does not have access to the requested tenant.
     */
    TENANT_ACCESS_DENIED(
            "TENANT_ACCESS_DENIED",
            "Access denied to tenant",
            HttpStatus.FORBIDDEN,
            ErrorSeverity.HIGH,
            "You do not have access to this resource."
    ),
    
    /**
     * Invalid tenant ID provided.
     */
    TENANT_INVALID(
            "TENANT_INVALID",
            "Invalid tenant ID",
            HttpStatus.BAD_REQUEST,
            ErrorSeverity.MEDIUM,
            "Invalid tenant specified"
    ),
    
    /**
     * User ID is missing or invalid.
     */
    USER_ID_INVALID(
            "USER_ID_INVALID",
            "Invalid or missing user ID",
            HttpStatus.BAD_REQUEST,
            ErrorSeverity.MEDIUM,
            "Invalid user information"
    ),
    
    /**
     * Key store initialization failed.
     */
    KEYSTORE_INIT_FAILED(
            "KEYSTORE_INIT_FAILED",
            "Failed to initialize key store",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.CRITICAL,
            "Authentication service unavailable. Please contact support."
    ),
    
    /**
     * Key rotation operation failed.
     */
    KEY_ROTATION_FAILED(
            "KEY_ROTATION_FAILED",
            "Key rotation failed",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.CRITICAL,
            "System maintenance in progress. Please try again later."
    ),
    
    /**
     * Signing key not found in key store.
     */
    SIGNING_KEY_NOT_FOUND(
            "SIGNING_KEY_NOT_FOUND",
            "Signing key not found for keyId",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.CRITICAL,
            "Authentication service error. Please contact support."
    ),
    
    /**
     * Verification key not found in key store.
     */
    VERIFICATION_KEY_NOT_FOUND(
            "VERIFICATION_KEY_NOT_FOUND",
            "Verification key not found for keyId",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.CRITICAL,
            "Authentication service error. Please contact support."
    ),
    
    /**
     * Invalid key ID provided.
     */
    KEY_ID_INVALID(
            "KEY_ID_INVALID",
            "Invalid key ID provided",
            HttpStatus.BAD_REQUEST,
            ErrorSeverity.MEDIUM,
            "Invalid key identifier"
    ),
    
    /**
     * Key generation failed.
     */
    KEY_GENERATION_FAILED(
            "KEY_GENERATION_FAILED",
            "Failed to generate key pair",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Key generation service error. Please contact support."
    ),
    
    /**
     * Key encoding/decoding failed.
     */
    KEY_ENCODING_ERROR(
            "KEY_ENCODING_ERROR",
            "Failed to encode or decode key",
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorSeverity.HIGH,
            "Key processing error. Please contact support."
    );
    
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
    private final ErrorSeverity severity;
    private final String userMessage;
    
    TokenErrorCode(String code, String message, HttpStatus httpStatus, 
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
