package com.sanketa.fabric.cache.service;

import com.sanketa.fabric.cache.config.RedisProperties;
import com.sanketa.fabric.cache.exception.CacheErrorCode;
import com.sanketa.fabric.cache.exception.CacheException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Slf4j
@Service
@ConditionalOnProperty(name = "fabric.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisProperties redisProperties;
    
    public RedisCacheService(
            RedisTemplate<String, Object> redisTemplate,
            RedisProperties redisProperties) {
        this.redisTemplate = redisTemplate;
        this.redisProperties = redisProperties;
    }
    
    /**
     * Get cache configuration for a cache type
     */
    RedisProperties.CacheConfig getCacheConfig(CacheType cacheType) {
        return switch (cacheType) {
            case TENANT -> redisProperties.getTenant();
            case USER_TENANT -> redisProperties.getUserTenant();
            case GLOBAL -> redisProperties.getGlobal();
        };
    }
    
    /**
     * Build full cache key with prefix
     */
    String buildKey(CacheType cacheType, String key) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        String cachePrefix = config.getKeyPrefix().isEmpty() 
                ? cacheType.getKeyPrefix() 
                : config.getKeyPrefix();
        
        String globalPrefix = redisProperties.getKeyPrefix();
        if (globalPrefix == null || globalPrefix.isEmpty()) {
            // No global prefix, use cache prefix and key only
            return String.format("%s:%s", cachePrefix, key);
        } else {
            return String.format("%s:%s:%s", globalPrefix, cachePrefix, key);
        }
    }
    
    /**
     * Get cache context for a specific cache type
     * Usage: cacheService.getContext(CacheType.GLOBAL).get("key", String.class)
     * 
     * @param cacheType The cache type to get context for
     * @return CacheContext for the specified cache type
     */
    public CacheContext getContext(CacheType cacheType) {
        return new CacheContext(redisTemplate, redisProperties, cacheType, this);
    }
    
    /**
     * Handle cache exception based on configuration
     */
    private void handleException(String operation, String key, Exception e, boolean isCritical) 
            throws CacheException {
        RedisProperties.ExceptionHandling config = redisProperties.getExceptionHandling();

        boolean shouldThrow = !config.isFailGracefully() || 
                             (isCritical && config.isThrowOnCriticalOperations());
        if (config.isLogExceptions()) {
            if (shouldThrow) {
                log.error("Cache {} failed for key: {} - throwing exception", operation, key, e);
            } else {
                log.warn("Cache {} failed for key: {} - failing gracefully", operation, key, e);
            }
        }

        if (shouldThrow) {
            CacheErrorCode errorCode = determineErrorCode(e, operation);
            throw new CacheException(errorCode, 
                String.format("Cache %s failed for key: %s", operation, key), e);
        }
    }
    
    /**
     * Determine appropriate error code based on exception type
     */
    private CacheErrorCode determineErrorCode(Exception e, String operation) {
        String exceptionType = e.getClass().getSimpleName().toLowerCase();
        
        if (exceptionType.contains("timeout") || exceptionType.contains("timedout")) {
            return CacheErrorCode.REDIS_TIMEOUT;
        } else if (exceptionType.contains("connection") || exceptionType.contains("connect")) {
            return CacheErrorCode.REDIS_CONNECTION_FAILED;
        } else if (exceptionType.contains("serialization") || exceptionType.contains("serialize")) {
            return CacheErrorCode.REDIS_SERIALIZATION_ERROR;
        } else {
            return CacheErrorCode.CACHE_OPERATION_FAILED;
        }
    }
    
    /**
     * Get value from cache
     */
    @SuppressWarnings("unchecked")
    public <T> T get(CacheType cacheType, String key, Class<T> type) throws CacheException {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return null;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            Object value = redisTemplate.opsForValue().get(fullKey);
            
            if (value == null) {
                log.debug("Cache miss for key: {}", fullKey);
                return null;
            }
            
            log.debug("Cache hit for key: {}", fullKey);
            return (T) value;
        } catch (Exception e) {
            handleException("get", key, e, false);
            return null;
        }
    }
    
    /**
     * Put value in cache with default TTL for cache type
     */
    public void put(CacheType cacheType, String key, Object value) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        put(cacheType, key, value, config.getDefaultTtl());
    }
    
    /**
     * Put value in cache with custom TTL
     */
    public void put(CacheType cacheType, String key, Object value, Duration ttl) throws CacheException {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            redisTemplate.opsForValue().set(fullKey, value, ttl);
            log.debug("Cached value for key: {} with TTL: {}", fullKey, ttl);
        } catch (Exception e) {
            handleException("put", key, e, true);
        }
    }
    
    /**
     * Delete value from cache
     */
    public void delete(CacheType cacheType, String key) throws CacheException {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            redisTemplate.delete(fullKey);
            log.debug("Deleted cache key: {}", fullKey);
        } catch (Exception e) {
            handleException("delete", key, e, true);
        }
    }
    
    /**
     * Delete multiple keys
     */
    public void deleteAll(CacheType cacheType, List<String> keys) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled() || keys == null || keys.isEmpty()) {
            return;
        }
        
        try {
            List<String> fullKeys = keys.stream()
                    .map(key -> buildKey(cacheType, key))
                    .toList();
            redisTemplate.delete(fullKeys);
            log.debug("Deleted {} cache keys", fullKeys.size());
        } catch (Exception e) {
            log.error("Error deleting cache keys", e);
        }
    }
    
    /**
     * Check if key exists
     */
    public boolean exists(CacheType cacheType, String key) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return false;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            Boolean exists = redisTemplate.hasKey(fullKey);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error checking existence of key: {}", key, e);
            return false;
        }
    }
    
    /**
     * Get TTL for a key
     */
    public long getTtl(CacheType cacheType, String key) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return -1;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            Long ttl = redisTemplate.getExpire(fullKey, TimeUnit.SECONDS);
            return ttl != null ? ttl : -1;
        } catch (Exception e) {
            log.error("Error getting TTL for key: {}", key, e);
            return -1;
        }
    }
    
    /**
     * Set TTL for a key
     */
    public boolean setTtl(CacheType cacheType, String key, Duration ttl) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return false;
        }
        
        try {
            String fullKey = buildKey(cacheType, key);
            Boolean result = redisTemplate.expire(fullKey, ttl);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("Error setting TTL for key: {}", key, e);
            return false;
        }
    }
    
    /**
     * Invalidate keys matching pattern
     */
    public void invalidatePattern(CacheType cacheType, String pattern) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return;
        }
        
        try {
            String fullPattern = buildKey(cacheType, pattern);
            Set<String> keys = redisTemplate.keys(fullPattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Invalidated {} keys matching pattern: {}", keys.size(), fullPattern);
            }
        } catch (Exception e) {
            log.error("Error invalidating pattern: {}", pattern, e);
        }
    }
    
    /**
     * Clear all keys for a cache type
     */
    public void clear(CacheType cacheType) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnabled()) {
            return;
        }
        
        try {
            String pattern = buildKey(cacheType, "*");
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Cleared {} cache keys for type: {}", keys.size(), cacheType);
            }
        } catch (Exception e) {
            log.error("Error clearing cache for type: {}", cacheType, e);
        }
    }
    
    /**
     * Cache-aside pattern: get from cache, or load from supplier and cache
     */
    public <T> T getOrLoad(CacheType cacheType, String key, Supplier<T> loader, Class<T> type) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        return getOrLoad(cacheType, key, loader, type, config.getDefaultTtl());
    }
    
    /**
     * Cache-aside pattern with custom TTL
     */
    public <T> T getOrLoad(CacheType cacheType, String key, Supplier<T> loader, Class<T> type, Duration ttl) {
        T value = get(cacheType, key, type);
        if (value != null) {
            return value;
        }
        
        try {
            value = loader.get();
            if (value != null) {
                put(cacheType, key, value, ttl);
            }
            return value;
        } catch (Exception e) {
            log.error("Error loading value for key: {}", key, e);
            return null;
        }
    }
    
    /**
     * Get cache statistics for a cache type
     */
    public CacheStats getStats(CacheType cacheType) {
        RedisProperties.CacheConfig config = getCacheConfig(cacheType);
        if (!config.isEnableStats()) {
            return null;
        }
        
        try {
            String pattern = buildKey(cacheType, "*");
            Set<String> keys = redisTemplate.keys(pattern);
            int keyCount = keys != null ? keys.size() : 0;
            
            return CacheStats.builder()
                    .cacheType(cacheType)
                    .keyCount(keyCount)
                    .enabled(config.isEnabled())
                    .defaultTtl(config.getDefaultTtl())
                    .build();
        } catch (Exception e) {
            log.error("Error getting cache stats for type: {}", cacheType, e);
            return null;
        }
    }
    
    /**
     * Cache statistics
     */
    @lombok.Data
    @lombok.Builder
    public static class CacheStats {
        private CacheType cacheType;
        private int keyCount;
        private boolean enabled;
        private Duration defaultTtl;
    }
}

