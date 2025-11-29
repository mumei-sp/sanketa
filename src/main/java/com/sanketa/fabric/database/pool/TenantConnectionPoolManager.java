package com.sanketa.fabric.database.pool;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.database.config.DatabaseProperties;
import com.sanketa.fabric.database.exception.TenantConnectionException;
import com.sanketa.fabric.database.validation.TenantContextValidator;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Manages connection pools per database instance.
 * 
 * @author mumei
 */
@Slf4j
@Component
public class TenantConnectionPoolManager {
    
    private final DatabaseProperties properties;
    private final ConcurrentHashMap<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ReentrantLock> lockMap = new ConcurrentHashMap<>();
    
    public TenantConnectionPoolManager(DatabaseProperties properties) {
        this.properties = properties;
    }
    
    /**
     * Get or create DataSource for the given tenant cache data.
     */
    public DataSource getDataSource(TenantCacheData tenantData) {
        TenantContextValidator.validateTenantData(tenantData);

        String cacheKey = getCacheKey(tenantData);
        DataSource dataSource = dataSourceCache.get(cacheKey);
        if (Objects.nonNull(dataSource)) {
            if (validateDataSource(dataSource)) {
                return dataSource;
            } else {
                // Remove invalid DataSource and recreate
                log.warn("Invalid DataSource found for key: {}, recreating", cacheKey);
                dataSourceCache.remove(cacheKey);
            }
        }
        
        // Create new DataSource with double-checked locking
        ReentrantLock lock = lockMap.computeIfAbsent(cacheKey, k -> new ReentrantLock());
        lock.lock();
        try {
            // Double-check after acquiring lock
            dataSource = dataSourceCache.get(cacheKey);
            if (dataSource != null && validateDataSource(dataSource)) {
                return dataSource;
            }

            log.info("Creating new DataSource for database instance: {}", tenantData.getDatabaseInstanceName());
            dataSource = createDataSource(tenantData);
            dataSourceCache.put(cacheKey, dataSource);
            return dataSource;
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * Create a new DataSource from tenant cache data.
     */
    private DataSource createDataSource(TenantCacheData tenantData) {
        String connectionString = tenantData.getConnectionString();
        String databaseType = Objects.nonNull(tenantData.getDatabaseType()) 
            ? tenantData.getDatabaseType().toUpperCase() 
            : "MYSQL";
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(connectionString);
        
        // pool configuration
        config.setMaximumPoolSize(properties.getPool().getMaxSize());
        config.setMinimumIdle(properties.getPool().getMinIdle());

        // HikariCP connection timeout = time to wait for a connection from the pool
        config.setConnectionTimeout(properties.getPool().getConnectionTimeout().toMillis());

        // These are JDBC driver-level timeouts, not pool-level
        long connectTimeoutMs = properties.getTimeout().getConnect().toMillis();
        long socketTimeoutMs = properties.getTimeout().getSocket().toMillis();
        long queryTimeoutMs = properties.getTimeout().getQuery().toMillis();
        
        // Set socket timeout (time to wait for data from database)
        configureConnectionTimeouts(config, databaseType, connectTimeoutMs, socketTimeoutMs, queryTimeoutMs);

        // keepaliveTime < idleTimeout < maxLifetime
        long idleTimeoutMs = properties.getPool().getIdleTimeout().toMillis();
        long maxLifetimeMs = properties.getPool().getMaxLifetime().toMillis();
        long keepaliveMs = properties.getPool().getTimeBetweenEvictionRuns().toMillis();

        // Ensure idleTimeout < maxLifetime
        if (idleTimeoutMs >= maxLifetimeMs) {
            long adjustedIdle = Math.max(0L, maxLifetimeMs - 1000L); // keep 1s margin
            log.warn("Adjusting idleTimeout from {} ms to {} ms to be less than maxLifetime {} ms",
                    idleTimeoutMs, adjustedIdle, maxLifetimeMs);
            idleTimeoutMs = adjustedIdle;
        }
        // Ensure keepaliveTime < idleTimeout (if keepalive enabled)
        if (keepaliveMs > 0 && keepaliveMs >= idleTimeoutMs) {
            long adjustedKeepalive = Math.max(0L, idleTimeoutMs - 1000L);
            log.warn("Adjusting keepaliveTime from {} ms to {} ms to be less than idleTimeout {} ms",
                    keepaliveMs, adjustedKeepalive, idleTimeoutMs);
            keepaliveMs = adjustedKeepalive;
        }
        config.setIdleTimeout(idleTimeoutMs);
        config.setMaxLifetime(maxLifetimeMs);

        // Only apply keepaliveTime if it remains positive; otherwise let Hikari default (disabled)
        if (keepaliveMs > 0) {
            config.setKeepaliveTime(keepaliveMs);
        }
        
        // Connection validation:
        // Prefer Hikari's driver-based Connection.isValid() by default.
        String validationQuery = getValidationQuery(databaseType);
        if (!Objects.isNull(validationQuery) && !validationQuery.isEmpty()) {
            config.setConnectionTestQuery(validationQuery);
        }
        
        // Pool name for monitoring
        config.setPoolName("TenantPool-" + tenantData.getDatabaseInstanceName());
        
        // Database-specific configuration
        configureDatabaseSpecificSettings(config, databaseType);
        
        try {
            HikariDataSource dataSource = new HikariDataSource(config);
            log.info("Successfully created DataSource for database instance: {}", 
                tenantData.getDatabaseInstanceName());
            return dataSource;
        } catch (Exception e) {
            log.error("Failed to create DataSource for database instance: {}", 
                tenantData.getDatabaseInstanceName(), e);
            throw new TenantConnectionException(
                "Failed to create DataSource: " + e.getMessage(),
                e
            );
        }
    }
    
    /**
     * Configure database-specific JDBC driver settings for the given {@code databaseType}.
     * 
     * @see <a href="https://github.com/brettwooldridge/HikariCP/wiki/MySQL-Configuration">
     *      HikariCP MySQL Configuration</a>
     * @see <a href="https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-performance-extensions.html">
     *      MySQL Connector/J Performance Properties</a>
     */
    private void configureDatabaseSpecificSettings(HikariConfig config, String databaseType) {
        switch (databaseType) {
            case "MYSQL":
            case "MARIADB":
                config.addDataSourceProperty("cachePrepStmts", "true");
                config.addDataSourceProperty("prepStmtCacheSize", "250");
                config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
                config.addDataSourceProperty("useServerPrepStmts", "false"); // modern default & recommended
                config.addDataSourceProperty("useLocalSessionState", "true");
                config.addDataSourceProperty("rewriteBatchedStatements", "true");
                config.addDataSourceProperty("cacheResultSetMetadata", "true");
                config.addDataSourceProperty("cacheServerConfiguration", "true");
                config.addDataSourceProperty("elideSetAutoCommits", "true");
                config.addDataSourceProperty("maintainTimeStats", "false");
                break;

            case "POSTGRESQL":
                // TODO: Add PostgreSQL driver-specific optimizations when required.
                break;

            case "MSSQL":
                // TODO: Add MSSQL driver-specific optimizations when required.
                break;

            default:
                log.warn("Unknown database type: {}, using default settings", databaseType);
        }
    }
    
    /**
     * Configure connection-level timeouts (connect, socket, query) for JDBC driver.
     * These timeouts are database-specific and set via data source properties.
     * 
     * @param config HikariCP configuration
     * @param databaseType Database type (MYSQL, POSTGRESQL, etc.)
     * @param connectTimeoutMs Connection establishment timeout in milliseconds
     * @param socketTimeoutMs Socket read timeout in milliseconds
     * @param queryTimeoutMs Query execution timeout in milliseconds
     */
    private void configureConnectionTimeouts(HikariConfig config, String databaseType, 
                                           long connectTimeoutMs, long socketTimeoutMs, long queryTimeoutMs) {
        switch (databaseType) {
            case "MYSQL":
            case "MARIADB":
                config.addDataSourceProperty("connectTimeout", String.valueOf(connectTimeoutMs));
                config.addDataSourceProperty("socketTimeout", String.valueOf(socketTimeoutMs));
                // Note: MySQL doesn't have a global query timeout property
                // Query timeout is typically set per statement or via Statement.setQueryTimeout()
                break;
                
            case "POSTGRESQL":
                // TODO: Add PostgreSQL connection timeout configuration when required
                break;
                
            case "MSSQL":
            case "SQLSERVER":
                // TODO: Add MSSQL/SQL Server connection timeout configuration when required
                break;
                
            default:
                log.debug("Connection timeout configuration not available for database type: {}", databaseType);
        }
    }
    
    /**
     * Get validation query for database type.
     */
    private String getValidationQuery(String databaseType) {
        String configured = properties.getPool().getValidationQuery();
        if (Objects.nonNull(configured) && !configured.isEmpty()) {
            return configured;
        }

        // No validation query configured: let Hikari use Connection.isValid()
        // which avoids an extra SQL round-trip and is recommended for modern drivers.
        return null;
    }
    
    /**
     * Generate cache key for DataSource.
     */
    private String getCacheKey(TenantCacheData tenantData) {
        if (Objects.isNull(tenantData.getDatabaseInstanceId())) {
            throw new IllegalStateException("databaseInstanceId must not be null for TenantCacheData");
        }
        return "instance-" + tenantData.getDatabaseInstanceId();
    }
    
    /**
     * Validate DataSource using lightweight checks.
     * For HikariCP DataSources, uses pool metrics instead of acquiring a connection
     * to avoid pool exhaustion under load.
     */
    private boolean validateDataSource(DataSource dataSource) {
        // Use lightweight validation for HikariCP DataSources
        if (dataSource instanceof HikariDataSource hikariDS) {
            try {
                var poolMXBean = hikariDS.getHikariPoolMXBean();
                if (poolMXBean != null) {
                    return !hikariDS.isClosed() && poolMXBean.getTotalConnections() >= 0;
                }
                // Fallback: check if DataSource is not closed
                return !hikariDS.isClosed();
            } catch (Exception e) {
                log.debug("Lightweight DataSource validation failed: {}", e.getMessage());
                return false;
            }
        }
        
        // For non-HikariCP DataSources, using connection validation as fallback
        try (Connection connection = dataSource.getConnection()) {
            return Objects.nonNull(connection) && !connection.isClosed();
        } catch (SQLException e) {
            log.warn("DataSource validation failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Remove DataSource from cache and clean up associated lock.
     */
    public void evictDataSource(String cacheKey) {
        DataSource dataSource = dataSourceCache.remove(cacheKey);
        if (dataSource instanceof HikariDataSource) {
            try {
                ((HikariDataSource) dataSource).close();
                log.info("Closed and evicted DataSource for key: {}", cacheKey);
            } catch (Exception e) {
                log.error("Error closing DataSource for key: {}", cacheKey, e);
            }
        }
        lockMap.remove(cacheKey);
    }
    
    /**
     * Get all cached DataSources (read-only snapshot).
     */
    public Map<String, DataSource> getAllDataSources() {
        return new HashMap<>(dataSourceCache);
    }
    
    /**
     * Close all DataSources and clear cache.
     */
    public void shutdown() {
        log.info("Shutting down TenantConnectionPoolManager, closing {} DataSources", 
            dataSourceCache.size());
        
        dataSourceCache.forEach((key, dataSource) -> {
            if (dataSource instanceof HikariDataSource) {
                try {
                    ((HikariDataSource) dataSource).close();
                } catch (Exception e) {
                    log.error("Error closing DataSource for key: {}", key, e);
                }
            }
        });
        
        dataSourceCache.clear();
        lockMap.clear();
    }

    /**
     * Warm up the connection pool for the given tenant by ensuring a DataSource
     * exists and validating a connection from the pool. (This method is idempotent)
     */
    public void warmupDataSource(TenantCacheData tenantData) {
        TenantContextValidator.validateTenantData(tenantData);

        DataSource dataSource = getDataSource(tenantData);
        try (Connection connection = dataSource.getConnection()) {
            int timeoutSeconds = (int) Math.max(1, properties.getHealth().getTimeout().getSeconds());
            boolean valid = connection.isValid(timeoutSeconds);
            if (!valid) {
                throw new TenantConnectionException(
                        "Connection validation failed during warm-up for instance: " +
                                tenantData.getDatabaseInstanceName()
                );
            }
            log.info("Warm-up successful for database instance: {}", tenantData.getDatabaseInstanceName());
        } catch (SQLException e) {
            log.error("Failed to warm up DataSource for database instance: {}",
                    tenantData.getDatabaseInstanceName(), e);
            throw new TenantConnectionException(
                    "Failed to warm up DataSource: " + e.getMessage(),
                    e
            );
        }
    }
}
