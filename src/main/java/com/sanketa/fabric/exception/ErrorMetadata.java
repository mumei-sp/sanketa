package com.sanketa.fabric.exception;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Generic, immutable metadata container for error context information.
 * 
 * Usage Examples:
 * // Empty metadata
 * ErrorMetadata metadata = ErrorMetadata.empty();
 * 
 * // Using builder with convenience methods
 * ErrorMetadata metadata = ErrorMetadata.builder()
 *     .correlationId("abc-123")
 *     .tenantId("101")
 *     .put("customKey", "customValue")
 *     .build();
 * 
 * // Add to existing metadata (creates new instance)
 * ErrorMetadata extended = metadata.with("operation", "getUser");
 * 
 * @author mumei
 * @since 1.0.0
 */
@Builder
@ToString
@EqualsAndHashCode
public final class ErrorMetadata implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Constants for common metadata field keys.
     */
    public static final String CORRELATION_ID = "correlationId";
    public static final String REQUEST_ID = "requestId";
    public static final String TENANT_ID = "tenantId";
    public static final String USER_ID = "userId";
    public static final String OPERATION = "operation";
    public static final String TIMESTAMP = "timestamp";
    
    private final Map<String, Object> data;

    private ErrorMetadata(Map<String, Object> data) {
        this.data = data != null 
            ? Collections.unmodifiableMap(new HashMap<>(data))
            : Collections.emptyMap();
    }
    
    /**
     * Creates an empty ErrorMetadata instance.
     */
    public static ErrorMetadata empty() {
        return ErrorMetadata.builder().build();
    }
    
    /**
     * Creates ErrorMetadata from an existing map.
     */
    public static ErrorMetadata of(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return empty();
        }
        return ErrorMetadata.builder().data(new HashMap<>(data)).build();
    }
    
    /**
     * Creates ErrorMetadata with a single key-value pair.
     */
    public static ErrorMetadata of(String key, Object value) {
        if (key == null || value == null) {
            return empty();
        }
        Map<String, Object> map = new HashMap<>();
        map.put(key, value);
        return ErrorMetadata.builder().data(map).build();
    }
    
    /**
     * Custom builder with convenience methods and auto-timestamp.
     */
    public static class ErrorMetadataBuilder {
        private Map<String, Object> data = new HashMap<>();
        
        public ErrorMetadataBuilder correlationId(String value) {
            return put(CORRELATION_ID, value);
        }
        
        public ErrorMetadataBuilder requestId(String value) {
            return put(REQUEST_ID, value);
        }
        
        public ErrorMetadataBuilder tenantId(String value) {
            return put(TENANT_ID, value);
        }
        
        public ErrorMetadataBuilder userId(String value) {
            return put(USER_ID, value);
        }
        
        public ErrorMetadataBuilder operation(String value) {
            return put(OPERATION, value);
        }
        
        public ErrorMetadataBuilder put(String key, Object value) {
            if (key != null && value != null) {
                this.data.put(key, value);
            }
            return this;
        }
        
        public ErrorMetadataBuilder putAll(Map<String, Object> map) {
            if (map != null) {
                this.data.putAll(map);
            }
            return this;
        }
        
        public ErrorMetadata build() {
            if (!this.data.containsKey(TIMESTAMP)) {
                this.data.put(TIMESTAMP, Instant.now());
            }
            Map<String, Object> immutableData = Collections.unmodifiableMap(new HashMap<>(this.data));
            return new ErrorMetadata(immutableData);
        }
    }
    
    /**
     * Creates a new ErrorMetadata with an additional key-value pair.
     * Returns a new instance (immutable).
     */
    public ErrorMetadata with(String key, Object value) {
        if (key == null || value == null) {
            return this;
        }
        return ErrorMetadata.builder()
            .putAll(this.data)
            .put(key, value)
            .build();
    }
    
    // Convenience getters
    public String getCorrelationId() {
        return get(CORRELATION_ID, String.class);
    }
    
    public String getRequestId() {
        return get(REQUEST_ID, String.class);
    }
    
    public String getTenantId() {
        return get(TENANT_ID, String.class);
    }
    
    public String getUserId() {
        return get(USER_ID, String.class);
    }
    
    public String getOperation() {
        return get(OPERATION, String.class);
    }
    
    public Instant getTimestamp() {
        return get(TIMESTAMP, Instant.class);
    }
    
    // Map-like access methods
    public Object get(String key) {
        return data.get(key);
    }
    
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        Object value = get(key);
        return (value != null && type.isInstance(value)) ? (T) value : null;
    }
    
    public boolean containsKey(String key) {
        return data.containsKey(key);
    }
    
    public Map<String, Object> getAll() {
        return data;
    }
    
    public Map<String, Object> getAttributes() {
        return getAll();
    }
    
    public boolean hasAttributes() {
        return !isEmpty();
    }
    
    public boolean isEmpty() {
        return data.isEmpty();
    }
    
    public int size() {
        return data.size();
    }
}
