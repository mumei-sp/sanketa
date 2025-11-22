package com.sanketa.fabric.cache.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Tenant cache data model
 * 
 * @author mumei
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantCacheData implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Long id;
    private String tenantCode;
    private String name;
    private Boolean isActive;
    private Long databaseInstanceId;
    private String databaseInstanceName;
    private String tenantSchema;
    
    // Database connection details (decrypted at cache load time)
    private String databaseHost;
    private Integer databasePort;
    private String databaseType; // MYSQL, POSTGRESQL, MSSQL
    private String connectionString; // Decrypted connection string
    private Boolean isHealthy; // DB instance health status
    
    private Instant cachedAt;
}
