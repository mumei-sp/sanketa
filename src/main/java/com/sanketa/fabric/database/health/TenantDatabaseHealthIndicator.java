package com.sanketa.fabric.database.health;

import com.sanketa.fabric.database.config.DatabaseProperties;
import com.sanketa.fabric.database.pool.TenantConnectionPoolManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Health indicator for tenant database connections.
 * 
 * This health indicator checks the health of all cached database instances asynchronously.
 * It is called by Spring Boot Actuator (e.g., /actuator/health) without tenant context,
 * so it iterates through all DataSources in the connection pool manager and checks each one.
 * 
 * Health checks run asynchronously in the background to avoid blocking the actuator endpoint.
 * Results are cached and returned immediately to prevent timeouts.
 *
 * @author mumei
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "fabric.database", name = "enabled", havingValue = "true", matchIfMissing = true)
@ConditionalOnProperty(prefix = "fabric.database.health", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TenantDatabaseHealthIndicator implements HealthIndicator {
    
    private final TenantConnectionPoolManager poolManager;
    private final DatabaseProperties.Health healthConfig;
    
    // Per-instance failure tracking (keyed by instance ID or cache key)
    private final ConcurrentHashMap<String, AtomicInteger> instanceFailureCounters = new ConcurrentHashMap<>();
    
    // Cached health result - always available to avoid blocking
    private volatile Health cachedHealth = null;
    private volatile long lastCheckTime = 0;
    private final ReentrantReadWriteLock cacheLock = new ReentrantReadWriteLock();
    
    // Scheduled executor for asynchronous health checks
    private ScheduledExecutorService healthCheckExecutor;
    
    public TenantDatabaseHealthIndicator(TenantConnectionPoolManager poolManager,
            DatabaseProperties properties) {
        this.poolManager = poolManager;
        this.healthConfig = properties.getHealth();
        this.cachedHealth = Health.unknown()
                .withDetail("status", "INITIALIZING")
                .withDetail("message", "Health checks are initializing")
                .build();
    }
    
    /**
     * Start the scheduled health check executor when the application context is ready.
     */
    @EventListener(ContextRefreshedEvent.class)
    public void startHealthCheckScheduler() {
        if (Objects.isNull(healthCheckExecutor) || healthCheckExecutor.isShutdown()) {
            healthCheckExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "tenant-db-health-check");
                t.setDaemon(true);
                return t;
            });
            
            // initial health check
            healthCheckExecutor.execute(this::performHealthCheck);
            
            // periodic health checks
            long intervalMillis = healthConfig.getInterval().toMillis();
            healthCheckExecutor.scheduleWithFixedDelay(
                    this::performHealthCheck,
                    intervalMillis,
                    intervalMillis,
                    TimeUnit.MILLISECONDS
            );
            
            log.info("Started asynchronous health check scheduler with interval: {}", healthConfig.getInterval());
        }
    }
    
    @Override
    public Health health() {
        cacheLock.readLock().lock();
        try {
            if (Objects.nonNull(cachedHealth)) {
                return cachedHealth;
            }
        } finally {
            cacheLock.readLock().unlock();
        }
        
        // shouldn't happen after initialization
        return Health.unknown()
                .withDetail("status", "UNKNOWN")
                .withDetail("message", "Health check not yet completed")
                .build();
    }
    
    /**
     * Perform health check of all cached database instances asynchronously.
     * This method updates the cached health result without blocking the actuator endpoint.
     */
    private void performHealthCheck() {
        try {
            Map<String, DataSource> allDataSources = poolManager.getAllDataSources();
            Health healthResult;
            if (allDataSources.isEmpty()) {
                healthResult = Health.unknown()
                        .withDetail("status", "UNKNOWN")
                        .withDetail("message", "No database instances have been initialized yet")
                        .withDetail("instancesChecked", 0)
                        .withDetail("lastCheckTime", System.currentTimeMillis())
                        .build();
            } else {
                healthResult = checkAllDatabaseInstances(allDataSources);
            }

            cacheLock.writeLock().lock();
            try {
                cachedHealth = healthResult;
                lastCheckTime = System.currentTimeMillis();
            } finally {
                cacheLock.writeLock().unlock();
            }
            
            log.debug("Health check completed. Total instances: {}, Status: {}", 
                    allDataSources.size(), 
                    healthResult.getStatus());
        } catch (Exception e) {
            log.error("Error during asynchronous health check", e);
            Health errorHealth = Health.down()
                    .withDetail("status", "ERROR")
                    .withDetail("message", "Health check failed: " + e.getMessage())
                    .withDetail("lastCheckTime", System.currentTimeMillis())
                    .build();
            
            cacheLock.writeLock().lock();
            try {
                cachedHealth = errorHealth;
                lastCheckTime = System.currentTimeMillis();
            } finally {
                cacheLock.writeLock().unlock();
            }
        }
    }
    
    /**
     * Check health of all cached database instances.
     * This is called asynchronously by the scheduled executor.
     */
    private Health checkAllDatabaseInstances(Map<String, DataSource> allDataSources) {
        List<Map<String, Object>> instanceHealths = new ArrayList<>();
        int healthyCount = 0;
        int unhealthyCount = 0;
        int totalInstances = allDataSources.size();
        
        for (Map.Entry<String, DataSource> entry : allDataSources.entrySet()) {
            String instanceKey = entry.getKey();
            DataSource dataSource = entry.getValue();
            try {
                long startTime = System.currentTimeMillis();
                try (Connection connection = dataSource.getConnection()) {
                    int timeoutSeconds = (int) Math.max(1, healthConfig.getTimeout().getSeconds());
                    boolean isValid = connection.isValid(timeoutSeconds);
                    
                    long responseTime = System.currentTimeMillis() - startTime;
                    boolean isHealthy = isValid && responseTime < healthConfig.getTimeout().toMillis();
                    
                    Map<String, Object> instanceHealth = new HashMap<>();
                    instanceHealth.put("instanceKey", instanceKey);
                    instanceHealth.put("status", isHealthy ? "UP" : "DOWN");
                    instanceHealth.put("responseTime", responseTime + "ms");
                    
                    // Adding pool metrics if available
                    if (dataSource instanceof HikariDataSource hikariDS) {
                        try {
                            var poolMXBean = hikariDS.getHikariPoolMXBean();
                            if (poolMXBean != null) {
                                instanceHealth.put("activeConnections", poolMXBean.getActiveConnections());
                                instanceHealth.put("idleConnections", poolMXBean.getIdleConnections());
                                instanceHealth.put("totalConnections", poolMXBean.getTotalConnections());
                            }
                        } catch (Exception e) {
                            log.debug("Could not retrieve HikariCP pool metrics for {}: {}", instanceKey, e.getMessage());
                        }
                    }
                    
                    if (isHealthy) {
                        healthyCount++;
                        resetFailureCounter(instanceKey);
                    } else {
                        unhealthyCount++;
                        String errorMsg = !isValid 
                            ? "Connection validation failed" 
                            : "Response time exceeded timeout: " + responseTime + "ms";
                        instanceHealth.put("error", errorMsg);
                        recordInstanceFailure(instanceKey, errorMsg);
                    }
                    
                    instanceHealths.add(instanceHealth);
                }
            } catch (Exception e) {
                unhealthyCount++;
                Map<String, Object> instanceHealth = new HashMap<>();
                instanceHealth.put("instanceKey", instanceKey);
                instanceHealth.put("status", "DOWN");
                instanceHealth.put("error", e.getMessage());
                instanceHealths.add(instanceHealth);
                recordInstanceFailure(instanceKey, "Health check failed: " + e.getMessage());
            }
        }

        Health.Builder healthBuilder;
        if (unhealthyCount == 0) {
            healthBuilder = Health.up();
        } else if (healthyCount == 0) {
            healthBuilder = Health.down();
        } else {
            healthBuilder = Health.up(); // At least one healthy, mark as UP but show details
        }
        
        Map<String, Object> details = new HashMap<>();
        details.put("totalInstances", totalInstances);
        details.put("healthyInstances", healthyCount);
        details.put("unhealthyInstances", unhealthyCount);
        details.put("instances", instanceHealths);
        details.put("lastCheckTime", System.currentTimeMillis());
        
        return healthBuilder.withDetails(details).build();
    }
    
    /**
     * Record instance failure for tracking consecutive failures.
     * This is used internally for failure threshold tracking.
     */
    private void recordInstanceFailure(String instanceKey, String message) {
        AtomicInteger failureCounter = instanceFailureCounters.computeIfAbsent(
            instanceKey, 
            k -> new AtomicInteger(0)
        );
        
        int failures = failureCounter.incrementAndGet();
        
        if (failures >= healthConfig.getFailureThreshold()) {
            log.warn("Database instance [{}] has {} consecutive failures: {}", 
                instanceKey, failures, message);
        } else {
            log.debug("Database instance [{}] health check failed ({} of {}): {}", 
                instanceKey, failures, healthConfig.getFailureThreshold(), message);
        }
    }
    
    /**
     * Reset failure counter for an instance on successful health check.
     */
    private void resetFailureCounter(String instanceKey) {
        AtomicInteger counter = instanceFailureCounters.get(instanceKey);
        if (Objects.nonNull(counter)) {
            counter.set(0);
        }
    }
    
    /**
     * Clean up failure counters for instances that are no longer active.
     * This can be called periodically to prevent memory leaks.
     */
    public void cleanupStaleCounters() {
        // Removing counters with zero failures to prevent unbounded growth
        instanceFailureCounters.entrySet().removeIf(entry -> 
            entry.getValue().get() == 0
        );
    }
    
    /**
     * Shutdown the health check executor when the bean is destroyed.
     */
    @PreDestroy
    public void shutdown() {
        if (Objects.nonNull(healthCheckExecutor) && !healthCheckExecutor.isShutdown()) {
            log.info("Shutting down health check executor");
            healthCheckExecutor.shutdown();
            try {
                if (!healthCheckExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                    log.warn("Health check executor did not terminate gracefully, forcing shutdown");
                    healthCheckExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                log.warn("Interrupted while waiting for health check executor to shutdown", e);
                healthCheckExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
