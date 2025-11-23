package com.sanketa.fabric.exception;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Base exception class for all application-specific exceptions.
 * 
 * Usage Example:
 * public enum MyServiceErrorCode implements ErrorCode {
 *     RESOURCE_NOT_FOUND("MY_SERVICE_RESOURCE_NOT_FOUND", 
 *                        "Resource not found", 
 *                        HttpStatus.NOT_FOUND, 
 *                        ErrorSeverity.MEDIUM);
 *     
 *     // ... enum implementation
 * }
 * 
 * public class MyServiceException extends BaseException {
 *     public MyServiceException(MyServiceErrorCode errorCode) {
 *         super(errorCode);
 *     }
 *     
 *     public MyServiceException(MyServiceErrorCode errorCode, String message) {
 *         super(errorCode, message);
 *     }
 *     
 *     public MyServiceException(MyServiceErrorCode errorCode, Throwable cause) {
 *         super(errorCode, cause);
 *     }
 *     
 *     public MyServiceException(MyServiceErrorCode errorCode, String message, Throwable cause) {
 *         super(errorCode, message, cause);
 *     }
 * }
 * 
 * @author mumei
 * @since 1.0.0
 */
@Getter
public abstract class BaseException extends RuntimeException implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private final ErrorCode errorCode;
    private final ErrorMetadata metadata;
    private final Instant timestamp;
    private final boolean includeStackTrace;
    @Setter
    private String userMessage;
    
    /**
     * Constructs a new BaseException with the specified error code.
     * 
     * @param errorCode the error code for this exception
     */
    protected BaseException(ErrorCode errorCode) {
        this(errorCode, null, null, null, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code and message.
     * 
     * @param errorCode the error code for this exception
     * @param message the detail message (can override the error code's default message)
     */
    protected BaseException(ErrorCode errorCode, String message) {
        this(errorCode, message, null, null, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code and cause.
     * 
     * @param errorCode the error code for this exception
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    protected BaseException(ErrorCode errorCode, Throwable cause) {
        this(errorCode, null, cause, null, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code, message, and cause.
     * 
     * @param errorCode the error code for this exception
     * @param message the detail message (can override the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    protected BaseException(ErrorCode errorCode, String message, Throwable cause) {
        this(errorCode, message, cause, null, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code and metadata.
     * 
     * @param errorCode the error code for this exception
     * @param metadata the error metadata containing contextual information
     */
    protected BaseException(ErrorCode errorCode, ErrorMetadata metadata) {
        this(errorCode, null, null, metadata, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code, message, and metadata.
     * 
     * @param errorCode the error code for this exception
     * @param message the detail message (can override the error code's default message)
     * @param metadata the error metadata containing contextual information
     */
    protected BaseException(ErrorCode errorCode, String message, ErrorMetadata metadata) {
        this(errorCode, message, null, metadata, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code, cause, and metadata.
     * 
     * @param errorCode the error code for this exception
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     * @param metadata the error metadata containing contextual information
     */
    protected BaseException(ErrorCode errorCode, Throwable cause, ErrorMetadata metadata) {
        this(errorCode, null, cause, metadata, true);
    }
    
    /**
     * Constructs a new BaseException with the specified error code, message, cause, and metadata.
     * 
     * @param errorCode the error code for this exception
     * @param message the detail message (can override the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     * @param metadata the error metadata containing contextual information
     */
    protected BaseException(ErrorCode errorCode, String message, Throwable cause, ErrorMetadata metadata) {
        this(errorCode, message, cause, metadata, true);
    }
    
    /**
     * Full constructor with all parameters.
     * 
     * @param errorCode the error code for this exception
     * @param message the detail message (can override the error code's default message)
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     * @param metadata the error metadata containing contextual information
     * @param includeStackTrace whether to include stack trace in serialization
     */
    protected BaseException(ErrorCode errorCode, String message, Throwable cause, 
                           ErrorMetadata metadata, boolean includeStackTrace) {
        super(message != null ? message : (errorCode != null ? errorCode.getMessage() : null), cause);
        this.errorCode = Objects.requireNonNull(errorCode, "Error code cannot be null");
        this.metadata = metadata != null ? metadata : ErrorMetadata.empty();
        this.timestamp = Instant.now();
        this.includeStackTrace = includeStackTrace;
        this.userMessage = errorCode.getUserMessage();
        
        // Suppress stack trace if not needed (for performance in high-volume scenarios)
        if (!includeStackTrace) {
            this.setStackTrace(new StackTraceElement[0]);
        }
    }
    
    /**
     * Gets the error code string.
     * 
     * @return the error code string
     */
    public String getCode() {
        return errorCode.getCode();
    }
    
    /**
     * Gets the HTTP status code that should be returned for this exception.
     * 
     * @return the HTTP status code
     */
    public HttpStatus getHttpStatus() {
        return errorCode.getHttpStatus();
    }
    
    /**
     * Gets the severity level of this exception.
     * 
     * @return the error severity
     */
    public ErrorSeverity getSeverity() {
        return errorCode.getSeverity();
    }
    
    /**
     * Gets the user-friendly message for this exception.
     * 
     * @return the user-friendly message
     */
    public String getUserMessage() {
        return userMessage != null ? userMessage : errorCode.getUserMessage();
    }
    
    /**
     * Checks whether stack trace should be included.
     * 
     * @return true if stack trace should be included, false otherwise
     */
    public boolean shouldIncludeStackTrace() {
        return includeStackTrace;
    }
    
    /**
     * Checks whether this exception should be logged.
     * 
     * @return true if this exception should be logged, false otherwise
     */
    public boolean shouldLog() {
        return errorCode.shouldLog();
    }
    
    /**
     * Checks whether this exception should trigger alerts.
     * 
     * @return true if this exception should trigger alerts, false otherwise
     */
    public boolean shouldAlert() {
        return errorCode.shouldAlert();
    }
    
    /**
     * Gets the correlation ID from metadata.
     * 
     * @return the correlation ID, or null if not available
     */
    public String getCorrelationId() {
        return metadata.getCorrelationId();
    }
    
    /**
     * Gets the request ID from metadata.
     * 
     * @return the request ID, or null if not available
     */
    public String getRequestId() {
        return metadata.getRequestId();
    }
    
    /**
     * Gets the tenant ID from metadata.
     * 
     * @return the tenant ID, or null if not available
     */
    public String getTenantId() {
        return metadata.getTenantId();
    }
    
    /**
     * Gets the user ID from metadata.
     * 
     * @return the user ID, or null if not available
     */
    public String getUserId() {
        return metadata.getUserId();
    }
    
    /**
     * Creates a builder for constructing ErrorMetadata and attaching it to this exception.
     * Note: This returns a new exception instance since BaseException is immutable.
     * 
     * @return a new BaseException with the built metadata
     */
    public BaseException withMetadata(ErrorMetadata metadata) {
        return createCopyWithMetadata(metadata);
    }
    
    /**
     * Template method for subclasses to create a copy with new metadata.
     * Subclasses should override this to return an instance of their own type.
     * 
     * @param metadata the new metadata
     * @return a new exception instance with the metadata
     */
    protected BaseException createCopyWithMetadata(ErrorMetadata metadata) {
        return new BaseException(errorCode, getMessage(), getCause(), metadata, includeStackTrace) {};
    }
    
    @Override
    public String toString() {
        return String.format("%s{code='%s', message='%s', httpStatus=%s, severity=%s, timestamp=%s%s}",
            getClass().getSimpleName(),
            getCode(),
            getMessage(),
            getHttpStatus(),
            getSeverity(),
            timestamp,
            metadata.hasAttributes() ? ", metadata=" + metadata : "");
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseException that = (BaseException) o;
        return Objects.equals(errorCode, that.errorCode) &&
               Objects.equals(getMessage(), that.getMessage()) &&
               Objects.equals(getCause(), that.getCause()) &&
               Objects.equals(metadata, that.metadata);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(errorCode, getMessage(), getCause(), metadata);
    }
}
