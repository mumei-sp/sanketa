package com.sanketa.fabric.cache.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

/**
 * User-tenant mapping cache data model
 * 
 * This model stores only the user-to-tenant mapping (which tenants a user has access to).
 * For tenant details (including DB connection info), use TenantCacheService.getTenantById()
 * 
 * @author mumei
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTenantCacheData implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
    
    /**
     * User ID from Global DB
     */
    private Long userId;
    
    /**
     * Keycloak user ID (UUID)
     */
    private String keycloakUserId;
    
    /**
     * List of tenant IDs the user has access to
     * Use TenantCacheService.getTenantById(tenantId) to get full tenant details
     */
    private List<Long> tenantIds;
    
    /**
     * Timestamp when this data was cached
     */
    private Instant cachedAt;
}
