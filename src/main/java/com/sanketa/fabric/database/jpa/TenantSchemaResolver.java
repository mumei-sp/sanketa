package com.sanketa.fabric.database.jpa;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.database.config.DatabaseProperties;
import com.sanketa.fabric.database.exception.DatabaseErrorCode;
import com.sanketa.fabric.database.exception.TenantSchemaException;
import com.sanketa.fabric.database.pool.TenantConnectionPoolManager;
import com.sanketa.fabric.database.validation.TenantContextValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantSchemaResolver implements CurrentTenantIdentifierResolver<String> {

    private final DatabaseProperties properties;
    private final TenantConnectionPoolManager poolManager;
    
    // Cache schema validation results to avoid repeated database queries
    private final ConcurrentHashMap<String, Boolean> schemaValidationCache = new ConcurrentHashMap<>();

    private TenantCacheData getActiveTenantOrNull() {
        return TenantContextValidator.getActiveTenantOrNull();
    }

    /**
     * Validates that schema name exists and optionally validates that schema exists in database.
     */
    private void validateSchema(TenantCacheData tenant, String schema) {
        if (Objects.isNull(schema) || schema.isBlank()) {
            log.warn("Tenant {} does not have a configured schema", tenant.getId());
            throw new TenantSchemaException(
                    DatabaseErrorCode.SCHEMA_NOT_FOUND,
                    "Schema not configured properly for tenant: " + tenant.getId()
            );
        }
        
        // Optional: Validate schema exists in database (only if enabled in configuration)
        // This is an expensive check that queries the database, so it's optional
        if (properties.getSchema().isValidateSchema() && properties.getSchema().isValidateSchemaInDatabase()) {
            validateSchemaExistsInDatabase(tenant, schema);
        }
    }
    
    /**
     * Validates that the schema exists in the database by querying the database's schema catalog.
     * Results are cached to avoid repeated queries for the same schema.
     */
    private void validateSchemaExistsInDatabase(TenantCacheData tenant, String schemaName) {
        String cacheKey = tenant.getDatabaseInstanceId() + ":" + schemaName;
        Boolean cachedResult = schemaValidationCache.get(cacheKey);
        if (Boolean.TRUE.equals(cachedResult)) {
            log.debug("Schema '{}' validated (cached) for tenant {}", schemaName, tenant.getId());
            return;
        }
        
        DataSource dataSource = null;
        try {
            dataSource = poolManager.getDataSource(tenant);
            if (dataSource == null) {
                log.warn("Cannot validate schema '{}': DataSource not available for tenant {}", 
                        schemaName, tenant.getId());
                return;
            }
            
            String dbType = tenant.getDatabaseType();
            if (dbType == null || dbType.isBlank()) {
                dbType = "MYSQL";
            } else {
                dbType = dbType.toUpperCase();
            }
            boolean schemaExists = checkSchemaExists(dataSource, dbType, schemaName);
            
            if (schemaExists) {
                schemaValidationCache.put(cacheKey, true);
                log.debug("Schema '{}' validated in database for tenant {}", schemaName, tenant.getId());
            } else {
                // Not caching negative results (schema might be created later)
                log.warn("Schema '{}' does not exist in database for tenant {}", schemaName, tenant.getId());
                throw new TenantSchemaException(
                        DatabaseErrorCode.SCHEMA_NOT_FOUND,
                        "Schema '" + schemaName + "' does not exist in database for tenant: " + tenant.getId()
                );
            }
        } catch (TenantSchemaException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to validate schema '{}' in database for tenant {}: {}. " +
                    "Schema validation will be skipped for this check.", 
                    schemaName, tenant.getId(), e.getMessage());
            // Not failing if validation query fails - it might be a transient issue
            // The actual schema switch will fail if schema doesn't exist
        }
    }
    
    /**
     * Checks if a schema exists in the database by querying the database's schema catalog.
     */
    private boolean checkSchemaExists(DataSource dataSource, String databaseType, String schemaName) throws SQLException {
        String query = getSchemaExistenceQuery(databaseType, schemaName);
        
        try (Connection connection = dataSource.getConnection();
             var stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            
            return rs.next() && rs.getInt(1) > 0;
        }
    }
    
    /**
     * Gets the SQL query to check if a schema exists in the database.
     */
    private String getSchemaExistenceQuery(String databaseType, String schemaName) {
        return switch (databaseType.toUpperCase()) {
            case "MYSQL", "MARIADB" -> 
                "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '" + 
                escapeSqlString(schemaName) + "'";
            case "POSTGRESQL" -> {
                // TODO: Add PostgreSQL schema existence query when required
                log.warn("Schema existence query not available for PostgreSQL, skipping validation");
                yield "SELECT 1"; // Return a query that always succeeds
            }
            case "MSSQL", "SQLSERVER" -> {
                // TODO: Add MSSQL/SQL Server schema existence query when required
                log.warn("Schema existence query not available for MSSQL/SQL Server, skipping validation");
                yield "SELECT 1"; // Return a query that always succeeds
            }
            default -> {
                log.warn("Schema existence query not available for database type: {}, skipping validation", 
                        databaseType);
                yield "SELECT 1"; // Return a query that always succeeds
            }
        };
    }
    
    /**
     * Escapes SQL string to prevent SQL injection (Simple escaping)
     */
    private String escapeSqlString(String value) {
        if (Objects.isNull(value)) {
            return "";
        }
        return value.replace("'", "''");
    }

    @Override
    public String resolveCurrentTenantIdentifier() {
        try {
            TenantCacheData tenant = getActiveTenantOrNull();
            if (Objects.isNull(tenant)) {
                log.warn("TenantContext missing / invalid → cannot resolve schema");
                return null;
            }

            String schema = tenant.getTenantSchema();
            if (properties.getSchema().isValidateSchema()) {
                validateSchema(tenant, schema);
            }
            log.debug("Resolved schema '{}' for tenant '{}'", schema, tenant.getId());
            return schema;
        } catch (TenantSchemaException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error resolving tenant schema", ex);
            throw new TenantSchemaException(
                    DatabaseErrorCode.SCHEMA_NOT_FOUND,
                    "Failed to resolve tenant schema: " + ex.getMessage(),
                    ex
            );
        }
    }

    /**
     * Validates whether existing sessions should continue when tenant changes.
     *
     * If future architecture allows tenant context changes during sessions
     * (e.g., async processing), consider returning false to prevent
     * cross-tenant data leakage.
     */
    @Override
    public boolean validateExistingCurrentSessions() {
        return true; // Safe because tenant context is thread-isolated
    }

    public String getDatabaseType() {
        TenantCacheData tenant = getActiveTenantOrNull();
        if (Objects.isNull(tenant)) {
            log.warn("Cannot determine database type: tenant context is missing");
            return "MYSQL"; // Default fallback
        }
        
        String dbType = tenant.getDatabaseType();
        if (Objects.isNull(dbType) || dbType.isBlank()) {
            log.warn("Database type not set for tenant {}, defaulting to MYSQL", tenant.getId());
            return "MYSQL"; // Default fallback
        }
        
        return dbType.toUpperCase();
    }

    private String getSchemaSwitchCommand(String db, String schema) {
        return switch (db.toUpperCase()) {
            case "MYSQL", "MARIADB" -> "USE `" + schema + "`";
            case "POSTGRESQL" -> {
                // TODO: Add PostgreSQL schema switch command when required
                log.warn("PostgreSQL schema switching not implemented, defaulting to MySQL syntax");
                yield "USE `" + schema + "`";
            }
            case "MSSQL", "SQLSERVER" -> {
                // TODO: Add MSSQL/SQL Server schema switch command when required
                log.warn("MSSQL/SQL Server schema switching not implemented, defaulting to MySQL syntax");
                yield "USE `" + schema + "`";
            }
            default -> {
                log.warn("Unknown DB type '{}', defaulting to MySQL syntax", db);
                yield "USE `" + schema + "`";
            }
        };
    }

    public void applySchemaToConnection(Connection connection, String schemaName) throws SQLException {
        if (!properties.getSchema().isEnabled()) {
            return;
        }
        if (Objects.isNull(schemaName) || schemaName.isBlank()) {
            log.warn("Cannot switch schema → name is blank");
            return;
        }

        TenantCacheData tenant = TenantContextValidator.validateAndResolveTenant();
        String dbType = tenant.getDatabaseType();
        if (Objects.isNull(dbType) || dbType.isBlank()) {
            log.warn("Database type not set for tenant {}, defaulting to MYSQL", tenant.getId());
            dbType = "MYSQL";
        } else {
            dbType = dbType.toUpperCase();
        }

        String sql = getSchemaSwitchCommand(dbType, schemaName);
        try (var stmt = connection.createStatement()) {
            stmt.execute(sql);
            log.debug("Switched to schema '{}' using SQL: {}", schemaName, sql);
        } catch (SQLException ex) {
            throw new TenantSchemaException(
                    DatabaseErrorCode.SCHEMA_SWITCH_FAILED,
                    "Failed switching schema: " + schemaName,
                    ex
            );
        }
    }

    public Map<String, Object> getHibernateProperties() {
        if (!properties.getSchema().isEnabled()) {
            return Map.of();
        }
        return Map.of(
                "hibernate.multiTenancy",
                "SCHEMA",
                "hibernate.multi_tenant_identifier_resolver",
                this
        );
    }
}
