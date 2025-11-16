package com.sanketa.fabric.exception;

import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Generic, immutable metadata container for error context information.
 * 
 * All metadata is stored in a generic map, with convenience methods 
 * for commonly used fields (correlationId, requestId, tenantId, userId, etc.).
 * 
 * <p><strong>Usage Examples:</strong></p>
 * <pre>{@code
 * // Using convenience methods for common fields
 * ErrorMetadata metadata = ErrorMetadata.builder()
 *     .correlationId("abc-123")
 *     .requestId("req-456")
 *     .tenantId("101")
 *     .userId("12345")
 *     .operation("getUser")
 *     .data("customField", 42)
 *     .data("nested", Map.of("key", "value"))
 *     .build();
 * 
 * // From existing map
 * ErrorMetadata metadata = ErrorMetadata.from(Map.of("key", "value"));
 * 
 * // Empty metadata
 * ErrorMetadata metadata = ErrorMetadata.empty();
 * }</pre>
 * 
 * @author mumei
 * @since 1.0.0
 */
@Builder
@Getter
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
    
    private final String correlationId;
    private final String requestId;
    private final String tenantId;
    private final String userId;
    private final String operation;
    @Builder.Default
    private final Instant timestamp = Instant.now();
    @Singular("data")
    private final Map<String, Object> data;
    
    /**
     * Creates an empty ErrorMetadata instance.
     * 
     * @return an empty ErrorMetadata
     */
    public static ErrorMetadata empty() {
        return ErrorMetadata.builder().build();
    }
    
    /**
     * Creates ErrorMetadata from an existing map.
     * 
     * @param dataMap the data map
     * @return ErrorMetadata instance
     */
    public static ErrorMetadata from(Map<String, Object> dataMap) {
        if (dataMap == null || dataMap.isEmpty()) {
            return empty();
        }
        
        ErrorMetadata.ErrorMetadataBuilder builder = ErrorMetadata.builder();
        
        // Extract common fields
        Object correlationId = dataMap.get(CORRELATION_ID);
        Object requestId = dataMap.get(REQUEST_ID);
        Object tenantId = dataMap.get(TENANT_ID);
        Object userId = dataMap.get(USER_ID);
        Object operation = dataMap.get(OPERATION);
        Object timestamp = dataMap.get(TIMESTAMP);
        
        if (correlationId instanceof String) {
            builder.correlationId((String) correlationId);
        }
        if (requestId instanceof String) {
            builder.requestId((String) requestId);
        }
        if (tenantId instanceof String) {
            builder.tenantId((String) tenantId);
        }
        if (userId instanceof String) {
            builder.userId((String) userId);
        }
        if (operation instanceof String) {
            builder.operation((String) operation);
        }
        if (timestamp instanceof Instant) {
            builder.timestamp((Instant) timestamp);
        }
        
        // Add remaining data
        Map<String, Object> remainingData = new HashMap<>(dataMap);
        remainingData.remove(CORRELATION_ID);
        remainingData.remove(REQUEST_ID);
        remainingData.remove(TENANT_ID);
        remainingData.remove(USER_ID);
        remainingData.remove(OPERATION);
        remainingData.remove(TIMESTAMP);
        
        remainingData.forEach(builder::data);
        
        return builder.build();
    }
    
    /**
     * Gets all data as an unmodifiable map, including convenience fields.
     * 
     * @return an unmodifiable map of all data
     */
    public Map<String, Object> getAll() {
        Map<String, Object> allData = new HashMap<>();
        
        if (correlationId != null) {
            allData.put(CORRELATION_ID, correlationId);
        }
        if (requestId != null) {
            allData.put(REQUEST_ID, requestId);
        }
        if (tenantId != null) {
            allData.put(TENANT_ID, tenantId);
        }
        if (userId != null) {
            allData.put(USER_ID, userId);
        }
        if (operation != null) {
            allData.put(OPERATION, operation);
        }
        if (timestamp != null) {
            allData.put(TIMESTAMP, timestamp);
        }
        
        if (data != null && !data.isEmpty()) {
            allData.putAll(data);
        }
        
        return Collections.unmodifiableMap(allData);
    }
    
    /**
     * Gets a value by key.
     * 
     * @param key the key
     * @return the value, or null if not found
     */
    public Object get(String key) {
        return switch (key) {
            case CORRELATION_ID -> correlationId;
            case REQUEST_ID -> requestId;
            case TENANT_ID -> tenantId;
            case USER_ID -> userId;
            case OPERATION -> operation;
            case TIMESTAMP -> timestamp;
            default -> data != null ? data.get(key) : null;
        };
    }
    
    /**
     * Gets a value by key with type safety.
     * 
     * @param key the key
     * @param type the expected type
     * @param <T> the type parameter
     * @return the value, or null if not found or type mismatch
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        Object value = get(key);
        if (value != null && type.isInstance(value)) {
            return (T) value;
        }
        return null;
    }
    
    /**
     * Checks if a key exists in the metadata.
     * 
     * @param key the key
     * @return true if the key exists, false otherwise
     */
    public boolean containsKey(String key) {
        return get(key) != null;
    }
    
    /**
     * Gets the size of the metadata.
     * 
     * @return the number of entries
     */
    public int size() {
        return getAll().size();
    }
    
    /**
     * Checks if the metadata is empty.
     * 
     * @return true if empty, false otherwise
     */
    public boolean isEmpty() {
        return getAll().isEmpty();
    }
    
    /**
     * Gets all attributes (alias for getAll() for backward compatibility).
     * 
     * @return an unmodifiable map of all attributes
     */
    public Map<String, Object> getAttributes() {
        return getAll();
    }
    
    /**
     * Checks if this metadata has any attributes (backward compatibility).
     * 
     * @return true if attributes exist, false otherwise
     */
    public boolean hasAttributes() {
        return !isEmpty();
    }
    
    /**
     * Gets a custom attribute by key (backward compatibility).
     * 
     * @param key the attribute key
     * @return the attribute value, or null if not found
     */
    public Object getAttribute(String key) {
        return get(key);
    }
    
    /**
     * Gets a custom attribute by key with type safety (backward compatibility).
     * 
     * @param key the attribute key
     * @param type the expected type
     * @param <T> the type parameter
     * @return the attribute value, or null if not found or type mismatch
     */
    public <T> T getAttribute(String key, Class<T> type) {
        return get(key, type);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ErrorMetadata that = (ErrorMetadata) o;
        return Objects.equals(getAll(), that.getAll());
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(getAll());
    }
    
    @Override
    public String toString() {
        return "ErrorMetadata{" +
               "data=" + getAll() +
               ", size=" + size() +
               '}';
    }
}
