package com.sanketa.fabric.token;

import com.sanketa.fabric.token.model.TenantContext;

/**
 * Thread-local store for Tenant Context
 * 
 * <p>Provides easy access to tenant context in any part of the application
 * without passing it through method parameters. Uses ThreadLocal to ensure
 * thread-safety and isolation between concurrent requests.</p>
 * 
 * <p><b>Lifecycle:</b></p>
 * <ul>
 *   <li>Context is set by {@link com.sanketa.fabric.token.filter.TenantContextTokenFilter}
 *       when a valid token is validated</li>
 *   <li>Context is cleared by {@link com.sanketa.fabric.token.config.TokenConfiguration#tenantContextCleanupFilter()}
 *       after request processing completes</li>
 * </ul>
 */
public final class TenantContextStore {
    
    /**
     * Thread-local storage for TenantContext
     */
    private static final ThreadLocal<TenantContext> CONTEXT_STORE = new ThreadLocal<>();
    

    private TenantContextStore() {
        throw new UnsupportedOperationException("TenantContextStore is a utility class and cannot be instantiated");
    }
    
    /**
     * Get current tenant context for this thread
     */
    public static TenantContext getContext() {
        return CONTEXT_STORE.get();
    }
    
    /**
     * Set tenant context for current thread
     */
    public static void setContext(TenantContext context) {
        CONTEXT_STORE.set(context);
    }
    
    /**
     * Clear tenant context for current thread
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
     * Require tenant context to be present
     */
    public static TenantContext requireContext() {
        TenantContext context = CONTEXT_STORE.get();
        if (context == null) {
            throw new IllegalStateException(
                "TenantContext is not available in current thread. " +
                "Ensure request has been processed by TenantContextTokenFilter.");
        }
        return context;
    }
    
    /**
     * Get user ID from context
     */
    public static Long getUserId() {
        TenantContext context = getContext();
        return context != null ? context.getUserId() : null;
    }
    
    /**
     * Get tenant IDs from context
     */
    public static java.util.List<Long> getTenantIds() {
        TenantContext context = getContext();
        return context != null ? context.getTenantIds() : null;
    }
    
    /**
     * Get active tenant ID from context
     */
    public static Long getActiveTenantId() {
        TenantContext context = getContext();
        return context != null ? context.getActiveTenantId() : null;
    }
    
    /**
     * Get effective tenant ID (active tenant if set and valid, otherwise first tenant)
     */
    public static Long getEffectiveTenantId() {
        TenantContext context = requireContext();
        return context.getEffectiveTenantId();
    }
    
    /**
     * Check if user has access to a specific tenant
     */
    public static boolean hasTenantAccess(Long tenantId) {
        TenantContext context = getContext();
        return context != null && context.hasTenantAccess(tenantId);
    }
}

