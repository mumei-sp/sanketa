package com.sanketa.fabric.token;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.token.model.RequestContext;
import com.sanketa.fabric.token.model.DatabaseScope;
import com.sanketa.fabric.token.model.TenantContext;

/**
 * Thread-local store for Request Context
 * 
 * Provides easy access to request context in any part of the application
 * without passing it through method parameters. Uses ThreadLocal to ensure
 * thread-safety and isolation between concurrent requests.
 * 
 * Lifecycle:
 *   Context is set by {@link com.sanketa.fabric.token.filter.TenantContextTokenFilter}
 *       when a valid token is validated and tenant details are loaded
 *   Context is cleared by {@link com.sanketa.fabric.token.config.TokenConfiguration#tenantContextCleanupFilter()}
 *       after request processing completes
 * 
 * @author mumei
 */
public final class TenantContextStore {
    
    /**
     * Thread-local storage for RequestContext
     */
    private static final ThreadLocal<RequestContext> CONTEXT_STORE = new ThreadLocal<>();
    

    private TenantContextStore() {
        throw new UnsupportedOperationException("TenantContextStore is a utility class and cannot be instantiated");
    }
    
    /**
     * Get current request context for this thread
     */
    public static RequestContext getContext() {
        return CONTEXT_STORE.get();
    }
    
    /**
     * Set request context for current thread
     */
    public static void setContext(RequestContext context) {
        CONTEXT_STORE.set(context);
    }
    
    /**
     * Clear request context for current thread
     * 
     * <p>Should be called after request processing to prevent memory leaks,
     * especially when using thread pools where threads are reused.</p>
     */
    public static void clearContext() {
        CONTEXT_STORE.remove();
    }
    
    /**
     * Check if context is set for current thread
     */
    public static boolean hasContext() {
        return CONTEXT_STORE.get() != null;
    }

    /**
     * Set advisory database scope to GLOBAL for the current request.
     *
     * This does NOT change the underlying DataSource routing; it is purely
     * a hint that can be used for logging and optional guardrails.
     */
    public static void setGlobalScope() {
        RequestContext context = requireContext();
        CONTEXT_STORE.set(
                RequestContext.builder()
                        .tenantContext(context.getTenantContext())
                        .activeTenantDetails(context.getActiveTenantDetails())
                        .dbScope(DatabaseScope.GLOBAL)
                        .build()
        );
    }

    /**
     * Set advisory database scope to TENANT for the current request.
     */
    public static void setTenantScope() {
        RequestContext context = requireContext();
        CONTEXT_STORE.set(
                RequestContext.builder()
                        .tenantContext(context.getTenantContext())
                        .activeTenantDetails(context.getActiveTenantDetails())
                        .dbScope(DatabaseScope.TENANT)
                        .build()
        );
    }

    /**
     * Execute an operation within a temporary database scope.
     *
     * This helper is purely advisory and does not affect DataSource routing.
     */
    public static <T> T withScope(DatabaseScope scope, java.util.function.Supplier<T> op) {
        RequestContext original = requireContext();
        DatabaseScope previousScope = original.getDbScope();
        try {
            CONTEXT_STORE.set(
                    RequestContext.builder()
                            .tenantContext(original.getTenantContext())
                            .activeTenantDetails(original.getActiveTenantDetails())
                            .dbScope(scope)
                            .build()
            );
            return op.get();
        } finally {
            CONTEXT_STORE.set(
                    RequestContext.builder()
                            .tenantContext(original.getTenantContext())
                            .activeTenantDetails(original.getActiveTenantDetails())
                            .dbScope(previousScope)
                            .build()
            );
        }
    }
    
    /**
     * Require request context to be present
     */
    public static RequestContext requireContext() {
        RequestContext context = CONTEXT_STORE.get();
        if (context == null) {
            throw new IllegalStateException(
                "RequestContext is not available in current thread. " +
                "Ensure request has been processed by TenantContextTokenFilter.");
        }
        return context;
    }
    
    /**
     * Get tenant context (token payload) from request context
     */
    public static TenantContext getTenantContext() {
        RequestContext context = getContext();
        return context != null ? context.getTenantContext() : null;
    }
    
    /**
     * Get active tenant details (with DB connection info) from request context
     */
    public static TenantCacheData getActiveTenantDetails() {
        RequestContext context = getContext();
        return context != null ? context.getActiveTenantDetails() : null;
    }
    
    /**
     * Get database connection string for active tenant
     */
    public static String getDatabaseConnectionString() {
        TenantCacheData details = getActiveTenantDetails();
        return details != null ? details.getConnectionString() : null;
    }
    
    /**
     * Get tenant schema name for active tenant
     */
    public static String getTenantSchema() {
        TenantCacheData details = getActiveTenantDetails();
        return details != null ? details.getTenantSchema() : null;
    }
    
    /**
     * Get database host for active tenant
     */
    public static String getDatabaseHost() {
        TenantCacheData details = getActiveTenantDetails();
        return details != null ? details.getDatabaseHost() : null;
    }
    
    /**
     * Get database port for active tenant
     */
    public static Integer getDatabasePort() {
        TenantCacheData details = getActiveTenantDetails();
        return details != null ? details.getDatabasePort() : null;
    }
    
    /**
     * Get database type for active tenant
     */
    public static String getDatabaseType() {
        TenantCacheData details = getActiveTenantDetails();
        return details != null ? details.getDatabaseType() : null;
    }
    
    /**
     * Get user ID from context
     */
    public static Long getUserId() {
        TenantContext context = getTenantContext();
        return context != null ? context.getUserId() : null;
    }
    
    /**
     * Get tenant IDs from context
     */
    public static java.util.List<Long> getTenantIds() {
        TenantContext context = getTenantContext();
        return context != null ? context.getTenantIds() : null;
    }
    
    /**
     * Get active tenant ID from context
     */
    public static Long getActiveTenantId() {
        TenantContext context = getTenantContext();
        return context != null ? context.getActiveTenantId() : null;
    }
    
    /**
     * Get effective tenant ID (active tenant if set and valid, otherwise first tenant)
     */
    public static Long getEffectiveTenantId() {
        TenantContext context = requireContext().getTenantContext();
        return context.getEffectiveTenantId();
    }
    
    /**
     * Check if user has access to a specific tenant
     */
    public static boolean hasTenantAccess(Long tenantId) {
        TenantContext context = getTenantContext();
        return context != null && context.hasTenantAccess(tenantId);
    }
}
