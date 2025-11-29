package com.sanketa.fabric.database;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.cache.tenant.TenantCacheService;
import com.sanketa.fabric.cache.service.RedisCacheService;
import com.sanketa.fabric.database.config.TenantWarmupProperties;
import com.sanketa.fabric.database.pool.TenantConnectionPoolManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Orchestrates warm-up of critical tenants' database connection pools and Redis connectivity
 * on application startup.
 *
 * If warm-up is enabled and any critical tenant fails to warm up, the application startup
 * will fail fast by throwing an exception.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantWarmupRunner {

    private final TenantWarmupProperties warmupProperties;
    private final TenantConnectionPoolManager connectionPoolManager;
    private final RedisCacheService redisCacheService;
    private final TenantCacheService tenantCacheService;

    @EventListener(ApplicationReadyEvent.class)
    public void warmupCriticalTenants() {
        if (!warmupProperties.isEnabled()) {
            log.info("Tenant warm-up is disabled (fabric.tenant.warmup.enabled = false)");
            return;
        }

        List<String> criticalTenants = warmupProperties.getCriticalTenants();
        if (Objects.isNull(criticalTenants) || criticalTenants.isEmpty()) {
            log.warn("Tenant warm-up is enabled but no critical tenants are configured");
            return;
        }

        log.info("Starting warm-up for {} critical tenants: {}", criticalTenants.size(), criticalTenants);

        List<String> failedTenants = new ArrayList<>();

        for (String tenantIdentifier : criticalTenants) {
            try {
                warmupSingleTenant(tenantIdentifier);
            } catch (Exception ex) {
                failedTenants.add(tenantIdentifier);
                log.error("Warm-up failed for tenant identifier '{}': {}", tenantIdentifier, ex.getMessage(), ex);
            }
        }

        if (!failedTenants.isEmpty()) {
            String message = "Tenant warm-up failed for critical tenants: " + String.join(", ", failedTenants);
            log.error(message);
            // Fail fast on startup
            throw new IllegalStateException(message);
        }

        log.info("Tenant warm-up completed successfully for all configured critical tenants");
    }

    private void warmupSingleTenant(String tenantIdentifier) {
        TenantCacheData tenant = resolveTenant(tenantIdentifier);
        if (tenant == null) {
            throw new IllegalStateException("No tenant cache data found for identifier: " + tenantIdentifier);
        }

        log.info("Warming up tenant '{}' (ID: {}, instance: {})",
                tenantIdentifier, tenant.getId(), tenant.getDatabaseInstanceName());

        // Warm up database connection pool for tenant's database instance
        connectionPoolManager.warmupDataSource(tenant);

        // Warm up Redis connectivity (shared pool, but attributed to this tenant)
        redisCacheService.warmupTenant(tenantIdentifier);
    }

    private TenantCacheData resolveTenant(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            return null;
        }

        // Try resolving by numeric ID first
        TenantCacheData tenant = null;
        try {
            Long tenantId = Long.valueOf(tenantIdentifier);
            tenant = tenantCacheService.getTenantById(tenantId);
        } catch (NumberFormatException ignored) {
            // Not a numeric ID, fall through to code-based lookup
        }

        if (tenant == null) {
            tenant = tenantCacheService.getTenantByCode(tenantIdentifier);
        }

        return tenant;
    }
}


