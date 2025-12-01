package com.sanketa.fabric.token.model;

import com.sanketa.fabric.cache.model.TenantCacheData;
import lombok.Builder;
import lombok.Value;

/**
 * Request Context - Server-side context for request processing
 * 
 * @author mumei
 */
@Value
@Builder
public class RequestContext {
    
    /**
     * Tenant context from PASETO token payload
     */
    TenantContext tenantContext;
    
    /**
     * Active tenant details with database connection information
     */
    TenantCacheData activeTenantDetails;

    /**
     * Advisory database scope for this request.
     *
     * Defaults to TENANT in the normal {@code TenantContextTokenFilter} flow.
     * Global DB access does NOT rely on this flag for routing; it must always
     * use the dedicated Global DB access path (globalJdbcTemplate-backed services).
     */
    @Builder.Default
    DatabaseScope dbScope = DatabaseScope.TENANT;

    /**
     * Validate that RequestContext has all required fields for DB routing
     */
    public boolean isValidForDbRouting() {
        return tenantContext != null 
                && activeTenantDetails != null
                && activeTenantDetails.getConnectionString() != null
                && !activeTenantDetails.getConnectionString().isEmpty()
                && activeTenantDetails.getId() != null;
    }
}
