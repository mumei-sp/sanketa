package com.sanketa.fabric.database.routing;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.database.exception.DatabaseErrorCode;
import com.sanketa.fabric.database.exception.TenantContextMissingException;
import com.sanketa.fabric.database.exception.TenantDatabaseException;
import com.sanketa.fabric.database.pool.TenantConnectionPoolManager;
import com.sanketa.fabric.database.validation.TenantContextValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.Collections;
import java.util.Objects;

/**
 * Routing DataSource that dynamically selects the appropriate DataSource
 * based on the tenant context stored in ThreadLocal.
 * 
 * @author mumei
 */
@Slf4j
public class TenantRoutingDataSource extends AbstractRoutingDataSource {
    
    private final TenantConnectionPoolManager poolManager;
    
    /**
     * Constructs a new TenantRoutingDataSource.
     * 
     * @param poolManager The connection pool manager for tenant databases
     * @throws IllegalArgumentException if poolManager is null
     */
    public TenantRoutingDataSource(TenantConnectionPoolManager poolManager) {
        if (poolManager == null) {
            throw new IllegalArgumentException("TenantConnectionPoolManager cannot be null");
        }
        this.poolManager = poolManager;
        // Set default target DataSource (will be overridden by routing)
        setDefaultTargetDataSource(null);
        setTargetDataSources(Collections.emptyMap());
    }

    /**
     * Determine the current lookup key for routing.
     */
    @Override
    protected Object determineCurrentLookupKey() {
        long startTime = System.currentTimeMillis();
        TenantCacheData tenantData = null;

        try {
            tenantData = validateAndResolveTenant();
            if (Boolean.FALSE.equals(tenantData.getIsHealthy())) {
                log.warn("Routing to unhealthy DB instance: {} (tenant: {})",
                        tenantData.getDatabaseInstanceName(), tenantData.getId());
            }

            DataSource dataSource = poolManager.getDataSource(tenantData);
            if (dataSource == null) {
                log.error("PoolManager returned NULL datasource for tenant={} instance={}",
                        tenantData.getId(), tenantData.getDatabaseInstanceName());
                throw new TenantDatabaseException(
                        DatabaseErrorCode.DATASOURCE_CREATION_FAILED,
                        "Failed to obtain DataSource for instance: " + tenantData.getDatabaseInstanceName()
                );
            }

            logRoutingInfoIfNeeded(startTime, tenantData);
            return dataSource;
        }
        catch (TenantDatabaseException e) {
            throw e;
        }
        catch (IllegalStateException | IllegalArgumentException e) {
            log.error("Invalid routing state | tenant={} | instance={} | msg={}",
                    tenantData != null ? tenantData.getId() : "unknown",
                    tenantData != null ? tenantData.getDatabaseInstanceName() : "unknown",
                    e.getMessage(), e);

            throw new TenantContextMissingException(
                    "Invalid DB routing state: " + e.getMessage(), e
            );
        }
        catch (Exception e) {
            log.error("Unexpected routing error | tenant={} | instance={}",
                    tenantData != null ? tenantData.getId() : "unknown",
                    tenantData != null ? tenantData.getDatabaseInstanceName() : "unknown", e);

            throw new TenantDatabaseException(
                    DatabaseErrorCode.DATASOURCE_CREATION_FAILED,
                    "Unexpected error during DB routing: " + e.getMessage(), e
            );
        }
    }

    /**
     * Validates request context and returns the resolved TenantCacheData.
     */
    private TenantCacheData validateAndResolveTenant() {
        return TenantContextValidator.validateAndResolveTenant();
    }

    private void logRoutingInfoIfNeeded(long startTime, TenantCacheData tenantData) {

        if (log.isDebugEnabled()) {
            long duration = System.currentTimeMillis() - startTime;
            log.debug(
                    "DB routing in {}ms | instance={} | tenant={} | schema={} | type={}",
                    duration,
                    tenantData.getDatabaseInstanceName(),
                    tenantData.getId(),
                    tenantData.getTenantSchema(),
                    tenantData.getDatabaseType()
            );
        }

        boolean isFirstRouting = tenantData.getCachedAt() == null;
        boolean isUnhealthy = Boolean.FALSE.equals(tenantData.getIsHealthy());
        if (log.isInfoEnabled() && (isFirstRouting || isUnhealthy)) {
            log.info(
                    "Routing | instance={} | tenant={} | schema={} | healthy={}",
                    tenantData.getDatabaseInstanceName(),
                    tenantData.getId(),
                    tenantData.getTenantSchema(),
                    tenantData.getIsHealthy()
            );
        }
    }

    /**
     * Get the target DataSource for the current lookup key.
     */
    @Override
    protected DataSource determineTargetDataSource() {
        Object lookupKey = determineCurrentLookupKey();
        
        if (Objects.isNull(lookupKey)) {
            log.error("determineCurrentLookupKey returned null - tenant context may be missing");
            throw new TenantContextMissingException(
                "Cannot determine target DataSource: tenant context is missing"
            );
        }
        
        if (lookupKey instanceof DataSource) {
            return (DataSource) lookupKey;
        }
        
        // Fallback to parent implementation (should not happen in normal operation)
        log.warn("Lookup key is not a DataSource instance (type: {}), falling back to parent implementation",
            lookupKey != null ? lookupKey.getClass().getName() : "null");
        return super.determineTargetDataSource();
    }
    
    /**
     * Resolve the specified lookup key object, as defined in the
     * {@link #setTargetDataSources targetDataSources} map.
     */
    @Override
    protected DataSource resolveSpecifiedLookupKey(Object lookupKey) {
        if (lookupKey == null) {
            return null;
        }
        
        if (lookupKey instanceof DataSource) {
            return (DataSource) lookupKey;
        }
        
        // This should never happen in our architecture since we always return
        // DataSource objects from determineCurrentLookupKey()
        log.error("Unexpected lookup key type: {} (expected DataSource). This indicates a programming error.",
            lookupKey.getClass().getName());
        throw new TenantDatabaseException(
            DatabaseErrorCode.DATASOURCE_CREATION_FAILED,
            "Invalid lookup key type: " + lookupKey.getClass().getName() + 
            ". Expected DataSource instance. This indicates an internal routing error."
        );
    }
}
