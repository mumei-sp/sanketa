package com.sanketa.fabric.token.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * Tenant Context extracted from validated TCT
 * 
 * This is the parsed and validated context that flows through the application
 * after token validation. It's thread-safe and can be safely shared across threads.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContext {
    
    /**
     * User ID from Global DB
     */
    private Long userId;
    
    /**
     * List of tenant IDs the user has access to
     * Never null (empty list if no tenant access)
     */
    private List<Long> tenantIds;
    
    /**
     * Current active tenant ID (if user has selected one)
     * This is typically set via X-Active-Tenant-Id header
     */
    private Long activeTenantId;
    
    /**
     * Key ID used to sign the token
     * Enables key rotation support
     */
    private String keyId;
    
    /**
     * Token issued at timestamp (Unix epoch seconds)
     */
    private Long issuedAt;
    
    /**
     * Token expiration timestamp (Unix epoch seconds)
     */
    private Long expiresAt;
    
    /**
     * Check if user has access to a specific tenant
     * 
     * @param tenantId Tenant ID to check
     * @return true if user has access to the tenant
     */
    public boolean hasTenantAccess(Long tenantId) {
        if (tenantId == null || tenantIds == null) {
            return false;
        }
        return tenantIds.contains(tenantId);
    }
    
    /**
     * Check if user has any tenant access
     * 
     * @return true if user has access to at least one tenant
     */
    public boolean hasAnyTenantAccess() {
        return tenantIds != null && !tenantIds.isEmpty();
    }
    
    /**
     * Validate that active tenant is in the allowed list
     * 
     * @return true if active tenant is valid and user has access
     */
    public boolean isActiveTenantValid() {
        if (activeTenantId == null) {
            return false;
        }
        return hasTenantAccess(activeTenantId);
    }
    
    /**
     * Get the effective tenant ID to use for database routing
     * 
     * Returns active tenant if set and valid, otherwise returns first available tenant.
     * Useful when you need a tenant ID for routing but don't care which one.
     * 
     * @return Effective tenant ID
     * @throws IllegalStateException if user has no tenant access
     */
    public Long getEffectiveTenantId() {
        if (isActiveTenantValid()) {
            return activeTenantId;
        }
        if (hasAnyTenantAccess()) {
            return tenantIds.get(0);
        }
        throw new IllegalStateException(
            "No tenant access available for user: " + userId);
    }

}
