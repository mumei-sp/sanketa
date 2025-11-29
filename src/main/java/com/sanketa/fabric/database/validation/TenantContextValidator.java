package com.sanketa.fabric.database.validation;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.database.exception.TenantContextMissingException;
import com.sanketa.fabric.token.TenantContextStore;
import com.sanketa.fabric.token.model.RequestContext;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

/**
 * Centralized utility for validating tenant context for database operations.
 * 
 * @author mumei
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TenantContextValidator {
    
    /**
     * Validates that RequestContext exists and is valid for database routing.
     * 
     * @return Valid RequestContext
     * @throws TenantContextMissingException if context is missing or invalid
     */
    public static RequestContext validateRequestContext() {
        RequestContext requestContext = TenantContextStore.getContext();
        
        if (requestContext == null) {
            log.warn("RequestContext is null (ThreadLocal empty). Database operations cannot proceed.");
            throw new TenantContextMissingException(
                "RequestContext missing. Ensure TenantContextTokenFilter executed earlier."
            );
        }
        
        if (!requestContext.isValidForDbRouting()) {
            log.warn("Invalid RequestContext for DB routing.");
            throw new TenantContextMissingException(
                "RequestContext invalid for routing. Missing tenantId / instance / connectionString."
            );
        }
        
        return requestContext;
    }
    
    /**
     * Validates RequestContext and returns the resolved TenantCacheData.
     * 
     * @return Valid TenantCacheData
     * @throws TenantContextMissingException if context is missing, invalid, or tenant data is null
     */
    public static TenantCacheData validateAndResolveTenant() {
        RequestContext requestContext = validateRequestContext();
        
        TenantCacheData tenantData = requestContext.getActiveTenantDetails();
        if (tenantData == null) {
            log.error("ActiveTenantDetails is null even though RequestContext passed validation.");
            throw new TenantContextMissingException(
                "ActiveTenantDetails is null in RequestContext."
            );
        }
        
        return tenantData;
    }
    
    /**
     * Gets the active tenant or returns null if context is missing or invalid.
     * 
     * @return TenantCacheData if context is valid, null otherwise
     */
    public static TenantCacheData getActiveTenantOrNull() {
        RequestContext ctx = TenantContextStore.getContext();
        if (Objects.isNull(ctx) || !ctx.isValidForDbRouting()) {
            return null;
        }
        return ctx.getActiveTenantDetails();
    }
    
    /**
     * Validates that tenant data is not null and has a valid connection string.
     * 
     * @param tenantData Tenant data to validate
     * @throws TenantContextMissingException if tenant data or connection string is invalid
     */
    public static void validateTenantData(TenantCacheData tenantData) {
        if (Objects.isNull(tenantData) || tenantData.getConnectionString() == null) {
            throw new TenantContextMissingException(
                "Tenant data or connection string is null"
            );
        }
    }
}
