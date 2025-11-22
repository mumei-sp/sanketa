package com.sanketa.fabric.cache.service;

import com.sanketa.fabric.cache.config.RedisProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;

/**
 * Cache context for a specific cache type.
 * 
 * @author mumei
 */
@Slf4j
@RequiredArgsConstructor
public class CacheContext {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisProperties redisProperties;
    private final CacheType cacheType;
    private final RedisCacheService cacheService;
    
    /**
     * Get cache configuration for this cache type
     */
    private RedisProperties.CacheConfig getConfig() {
        return cacheService.getCacheConfig(cacheType);
    }
    
    /**
     * Build full cache key with prefix
     */
    private String buildKey(String key) {
        return cacheService.buildKey(cacheType, key);
    }
    
    /**
     * Get value from cache
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        return cacheService.get(cacheType, key, type);
    }
    
    /**
     * Put value in cache with default TTL
     */
    public void put(String key, Object value) {
        cacheService.put(cacheType, key, value);
    }
    
    /**
     * Put value in cache with custom TTL
     */
    public void put(String key, Object value, Duration ttl) {
        cacheService.put(cacheType, key, value, ttl);
    }
    
    /**
     * Delete value from cache
     */
    public void delete(String key) {
        cacheService.delete(cacheType, key);
    }
    
    /**
     * Delete multiple keys
     */
    public void deleteAll(List<String> keys) {
        cacheService.deleteAll(cacheType, keys);
    }
    
    /**
     * Check if key exists
     */
    public boolean exists(String key) {
        return cacheService.exists(cacheType, key);
    }
    
    /**
     * Get TTL for a key
     */
    public long getTtl(String key) {
        return cacheService.getTtl(cacheType, key);
    }
    
    /**
     * Set TTL for a key
     */
    public boolean setTtl(String key, Duration ttl) {
        return cacheService.setTtl(cacheType, key, ttl);
    }
    
    /**
     * Invalidate keys matching pattern
     */
    public void invalidatePattern(String pattern) {
        cacheService.invalidatePattern(cacheType, pattern);
    }
    
    /**
     * Clear all keys for this cache type
     */
    public void clear() {
        cacheService.clear(cacheType);
    }
    
    /**
     * Cache-aside pattern: get from cache, or load from supplier and cache
     */
    public <T> T getOrLoad(String key, Supplier<T> loader, Class<T> type) {
        return cacheService.getOrLoad(cacheType, key, loader, type);
    }
    
    /**
     * Cache-aside pattern with custom TTL
     */
    public <T> T getOrLoad(String key, Supplier<T> loader, Class<T> type, Duration ttl) {
        return cacheService.getOrLoad(cacheType, key, loader, type, ttl);
    }
}
