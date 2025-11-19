package com.sanketa.fabric.cache.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;

/**
 * Redis configuration properties.
 * 
 * - Connection pooling
 * - Separate cache configurations for tenants, users, and global data
 * - TTL management per cache type
 * - Health checks and monitoring
 */
@Data
@Validated
@ConfigurationProperties(prefix = "fabric.redis")
public class RedisProperties {
    
    /**
     * Enable Redis caching
     */
    private boolean enabled = true;
    
    /**
     * Standalone configuration
     */
    private Standalone standalone = new Standalone();
    
    /**
     * Connection pool configuration
     */
    private Pool pool = new Pool();
    
    /**
     * Timeout configuration
     */
    private Timeout timeout = new Timeout();
    
    /**
     * Tenant cache configuration
     */
    private CacheConfig tenant = new CacheConfig();
    
    /**
     * User-tenant cache configuration
     */
    private CacheConfig userTenant = new CacheConfig();
    
    /**
     * Global cache configuration
     */
    private CacheConfig global = new CacheConfig();
    
    /**
     * Health check configuration
     */
    private Health health = new Health();
    
    /**
     * Exception handling configuration
     */
    private ExceptionHandling exceptionHandling = new ExceptionHandling();
    
    /**
     * Key prefix for namespace isolation.
     * If empty, no prefix is added to keys.
     */
    private String keyPrefix = "";
    
    /**
     * Standalone Redis configuration
     */
    @Data
    public static class Standalone {
        @NotBlank
        private String host = "localhost";
        
        @Min(1)
        @Max(65535)
        private int port = 6379;
        
        private String password = "";
        
        @Min(0)
        private int database = 0;
    }
    
    /**
     * Connection pool configuration
     */
    @Data
    public static class Pool {
        @Min(1)
        private int maxActive = 20;
        
        @Min(1)
        private int maxIdle = 10;
        
        @Min(0)
        private int minIdle = 5;
        
        private Duration maxWait = Duration.ofMillis(2000);
        
        private boolean testOnBorrow = true;
        
        private boolean testOnReturn = false;
        
        private boolean testWhileIdle = true;
        
        private Duration timeBetweenEvictionRuns = Duration.ofSeconds(30);
    }
    
    /**
     * Timeout configuration
     */
    @Data
    public static class Timeout {
        private Duration connect = Duration.ofSeconds(10);
        
        private Duration command = Duration.ofSeconds(5);
    }
    
    /**
     * Cache-specific configuration
     */
    @Data
    public static class CacheConfig {
        /**
         * Enable this cache
         */
        private boolean enabled = true;
        
        /**
         * Default TTL for cache entries
         */
        private Duration defaultTtl = Duration.ofMinutes(30);
        
        /**
         * Key prefix for this cache (appended to global keyPrefix)
         */
        private String keyPrefix = "";
        
        /**
         * Enable cache statistics
         */
        private boolean enableStats = true;
    }
    
    /**
     * Health check configuration
     */
    @Data
    public static class Health {
        /**
         * Enable health checks
         */
        private boolean enabled = true;
        
        /**
         * Health check interval
         */
        private Duration interval = Duration.ofSeconds(30);
        
        /**
         * Health check timeout
         */
        private Duration timeout = Duration.ofSeconds(5);
        
        /**
         * Number of consecutive failures before marking as unhealthy
         */
        @Min(1)
        private int failureThreshold = 3;
    }
    
    /**
     * Exception handling configuration
     */
    @Data
    public static class ExceptionHandling {
        /**
         * Fail gracefully (return null/do nothing) instead of throwing exceptions
         * When true: cache failures won't break the application
         * When false: cache failures will throw CacheException (caught by GlobalExceptionHandler)
         */
        private boolean failGracefully = true;
        
        /**
         * Throw exceptions for critical operations even if failGracefully is true
         * Operations like: put, delete, clear
         */
        private boolean throwOnCriticalOperations = false;
        
        /**
         * Log exceptions even when failing gracefully
         */
        private boolean logExceptions = true;
    }
}

