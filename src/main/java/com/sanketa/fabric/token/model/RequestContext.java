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
