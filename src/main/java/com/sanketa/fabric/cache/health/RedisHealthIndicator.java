package com.sanketa.fabric.cache.health;

import com.sanketa.fabric.cache.config.RedisProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Redis Health Indicator
 * 
 * @author mumei
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "fabric.redis.enabled", havingValue = "true", matchIfMissing = true)
@ConditionalOnProperty(name = "fabric.redis.health.enabled", havingValue = "true", matchIfMissing = true)
public class RedisHealthIndicator implements HealthIndicator {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisProperties.Health healthConfig;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private volatile long lastCheckTime = 0;
    private volatile Health lastHealth = null;
    
    public RedisHealthIndicator(
            RedisTemplate<String, Object> redisTemplate,
            RedisProperties redisProperties) {
        this.redisTemplate = redisTemplate;
        this.healthConfig = redisProperties.getHealth();
    }
    
    @Override
    public Health health() {
        // Throttle health checks to avoid overwhelming Redis
        long now = System.currentTimeMillis();
        if (lastHealth != null && (now - lastCheckTime) < healthConfig.getInterval().toMillis()) {
            return lastHealth;
        }
        
        lastCheckTime = now;
        
        try {
            long startTime = System.currentTimeMillis();
            String result = redisTemplate.getConnectionFactory()
                    .getConnection()
                    .ping();
            long responseTime = System.currentTimeMillis() - startTime;

            boolean isHealthy = responseTime < healthConfig.getTimeout().toMillis();
            if (isHealthy && "PONG".equals(result)) {
                consecutiveFailures.set(0);
                
                Health.Builder healthBuilder = Health.up()
                        .withDetail("status", "UP")
                        .withDetail("responseTime", responseTime + "ms")
                        .withDetail("response", result);
                
                // Add cache statistics if available
                try {
                    Long dbSize = redisTemplate.getConnectionFactory()
                            .getConnection()
                            .dbSize();
                    if (dbSize != null) {
                        healthBuilder.withDetail("databaseSize", dbSize);
                    }
                } catch (Exception e) {
                    log.debug("Could not get database size", e);
                }
                
                lastHealth = healthBuilder.build();
                return lastHealth;
            } else {
                return handleFailure("PING response was not PONG or response time exceeded timeout");
            }
        } catch (Exception e) {
            return handleFailure("Redis health check failed: " + e.getMessage());
        }
    }
    
    private Health handleFailure(String message) {
        int failures = consecutiveFailures.incrementAndGet();
        
        if (failures >= healthConfig.getFailureThreshold()) {
            log.warn("Redis marked as DOWN after {} consecutive failures: {}", failures, message);
            lastHealth = Health.down()
                    .withDetail("status", "DOWN")
                    .withDetail("consecutiveFailures", failures)
                    .withDetail("error", message)
                    .build();
            return lastHealth;
        } else {
            log.debug("Redis health check failed ({} of {}): {}", 
                    failures, healthConfig.getFailureThreshold(), message);
            lastHealth = Health.up()
                    .withDetail("status", "DEGRADED")
                    .withDetail("consecutiveFailures", failures)
                    .withDetail("warning", message)
                    .build();
            return lastHealth;
        }
    }
}
