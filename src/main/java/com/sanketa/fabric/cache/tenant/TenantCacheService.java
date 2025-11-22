package com.sanketa.fabric.cache.tenant;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.cache.model.UserTenantCacheData;
import com.sanketa.fabric.cache.service.CacheType;
import com.sanketa.fabric.cache.service.RedisCacheService;
import com.sanketa.fabric.token.TenantContextStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Tenant-specific cache service.
 * 
 * This service is tenant-specific and should not be used by generic modules,
 * for generic cache operations use RedisCacheService.
 * 
 * @author mumei
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantCacheService {
    
    private final RedisCacheService cacheService;
    
    /**
     * Get current tenant data using active tenant from TenantContextStore
     */
    public TenantCacheData getCurrentTenant() {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context");
            return null;
        }
        
        return cacheService.get(CacheType.GLOBAL, String.format("tenant:id:%s", tenantId), TenantCacheData.class);
    }
    
    /**
     * Get current tenant data with cache-aside pattern
     */
    public TenantCacheData getCurrentTenantOrLoad(Supplier<TenantCacheData> loader) {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context, calling loader directly");
            return loader != null ? loader.get() : null;
        }
        
        return cacheService.getOrLoad(
            CacheType.GLOBAL,
            String.format("tenant:id:%s", tenantId),
            loader,
            TenantCacheData.class
        );
    }
    
    /**
     * Cache current tenant data
     */
    public void cacheCurrentTenant(TenantCacheData tenant) {
        if (tenant == null || tenant.getId() == null) {
            return;
        }
        
        Long contextTenantId = TenantContextStore.getEffectiveTenantId();
        if (contextTenantId != null && !contextTenantId.equals(tenant.getId())) {
            log.warn("Tenant ID mismatch: context has {}, but caching tenant {}", 
                    contextTenantId, tenant.getId());
        }
        
        cacheTenant(tenant);
    }
    
    /**
     * Invalidate current tenant cache
     */
    public void invalidateCurrentTenant() {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context for invalidation");
            return;
        }
        
        invalidateTenant(tenantId);
    }
    
    /**
     * Get current user's tenant mappings using user ID from TenantContextStore
     */
    public UserTenantCacheData getCurrentUserTenants() {
        Long userId = TenantContextStore.getUserId();
        if (userId == null) {
            log.debug("No user ID available in context");
            return null;
        }
        
        return cacheService.get(CacheType.USER_TENANT, String.format("user:%s", userId), UserTenantCacheData.class);
    }
    
    /**
     * Get current user's tenant mappings with cache-aside pattern
     */
    public UserTenantCacheData getCurrentUserTenantsOrLoad(Supplier<UserTenantCacheData> loader) {
        Long userId = TenantContextStore.getUserId();
        if (userId == null) {
            log.debug("No user ID available in context, calling loader directly");
            return loader != null ? loader.get() : null;
        }
        
        return cacheService.getOrLoad(
            CacheType.USER_TENANT,
            String.format("user:%s", userId),
            loader,
            UserTenantCacheData.class
        );
    }
    
    /**
     * Cache current user's tenant mappings
     */
    public void cacheCurrentUserTenants(UserTenantCacheData userTenants) {
        if (userTenants == null) {
            return;
        }
        
        Long contextUserId = TenantContextStore.getUserId();
        if (contextUserId != null && userTenants.getUserId() != null 
                && !contextUserId.equals(userTenants.getUserId())) {
            log.warn("User ID mismatch: context has {}, but caching user {}", 
                    contextUserId, userTenants.getUserId());
        }
        
        cacheUserTenants(userTenants);
    }
    
    /**
     * Invalidate current user's tenant cache
     */
    public void invalidateCurrentUser() {
        Long userId = TenantContextStore.getUserId();
        if (userId == null) {
            log.debug("No user ID available in context for invalidation");
            return;
        }
        
        invalidateUser(userId);
    }
        
    /**
     * Get configuration value scoped to current tenant
     */
    public <T> T getTenantScopedConfig(String configKey, Class<T> type) {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context for tenant-scoped config");
            return null;
        }
        
        String key = String.format("config:tenant:%s:%s", tenantId, configKey);
        return cacheService.get(CacheType.GLOBAL, key, type);
    }
    
    /**
     * Get tenant-scoped configuration with cache-aside pattern
     */
    public <T> T getTenantScopedConfigOrLoad(String configKey, Supplier<T> loader, Class<T> type) {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context, calling loader directly");
            return loader != null ? loader.get() : null;
        }
        
        String key = String.format("config:tenant:%s:%s", tenantId, configKey);
        return cacheService.getOrLoad(CacheType.GLOBAL, key, loader, type);
    }
    
    /**
     * Cache tenant-scoped configuration
     */
    public void cacheTenantScopedConfig(String configKey, Object value) {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context for tenant-scoped config");
            return;
        }
        
        String key = String.format("config:tenant:%s:%s", tenantId, configKey);
        cacheService.put(CacheType.GLOBAL, key, value);
    }
    
    /**
     * Invalidate all tenant-scoped configurations for current tenant
     */
    public void invalidateTenantScopedConfigs() {
        Long tenantId = TenantContextStore.getEffectiveTenantId();
        if (tenantId == null) {
            log.debug("No tenant ID available in context for invalidation");
            return;
        }
        
        cacheService.invalidatePattern(CacheType.GLOBAL, String.format("config:tenant:%s:*", tenantId));
    }
    
    /**
     * Get tenant by ID
     */
    public TenantCacheData getTenantById(Long tenantId) {
        if (tenantId == null) {
            return null;
        }
        return cacheService.get(CacheType.GLOBAL, String.format("tenant:id:%s", tenantId), TenantCacheData.class);
    }
    
    /**
     * Get tenant by tenant code
     */
    public TenantCacheData getTenantByCode(String tenantCode) {
        if (tenantCode == null || tenantCode.isEmpty()) {
            return null;
        }
        return cacheService.get(CacheType.GLOBAL, String.format("tenant:code:%s", tenantCode), TenantCacheData.class);
    }
    
    /**
     * Get tenant by ID with cache-aside pattern
     */
    public TenantCacheData getTenantById(Long tenantId, Supplier<TenantCacheData> loader) {
        if (tenantId == null) {
            return null;
        }
        return cacheService.getOrLoad(CacheType.GLOBAL, String.format("tenant:id:%s", tenantId), loader, TenantCacheData.class);
    }
    
    /**
     * Get tenant by code with cache-aside pattern
     */
    public TenantCacheData getTenantByCode(String tenantCode, Supplier<TenantCacheData> loader) {
        if (tenantCode == null || tenantCode.isEmpty()) {
            return null;
        }
        return cacheService.getOrLoad(CacheType.GLOBAL, String.format("tenant:code:%s", tenantCode), loader, TenantCacheData.class);
    }
    
    /**
     * Cache tenant data
     */
    public void cacheTenant(TenantCacheData tenant) {
        if (tenant == null || tenant.getId() == null) {
            return;
        }
        
        tenant.setCachedAt(java.time.Instant.now());
        
        // Cache by ID in GLOBAL cache
        cacheService.put(CacheType.GLOBAL, String.format("tenant:id:%s", tenant.getId()), tenant);
        
        // Cache by code if available in GLOBAL cache
        if (tenant.getTenantCode() != null && !tenant.getTenantCode().isEmpty()) {
            cacheService.put(CacheType.GLOBAL, String.format("tenant:code:%s", tenant.getTenantCode()), tenant);
        }
        
        log.debug("Cached tenant: {} (ID: {}, Code: {}) in GLOBAL cache", 
                tenant.getName(), tenant.getId(), tenant.getTenantCode());
    }
    
    /**
     * Invalidate tenant cache by ID
     */
    public void invalidateTenant(Long tenantId) {
        if (tenantId == null) {
            return;
        }
        cacheService.delete(CacheType.GLOBAL, String.format("tenant:id:%s", tenantId));
        log.debug("Invalidated tenant cache for ID: {} from GLOBAL cache", tenantId);
    }
    
    /**
     * Invalidate tenant cache by code
     */
    public void invalidateTenantByCode(String tenantCode) {
        if (tenantCode == null || tenantCode.isEmpty()) {
            return;
        }
        cacheService.delete(CacheType.GLOBAL, String.format("tenant:code:%s", tenantCode));
        log.debug("Invalidated tenant cache for code: {} from GLOBAL cache", tenantCode);
    }
    
    /**
     * Get user's tenant list by user ID
     */
    public UserTenantCacheData getUserTenants(Long userId) {
        if (userId == null) {
            return null;
        }
        return cacheService.get(CacheType.USER_TENANT, String.format("user:%s", userId), UserTenantCacheData.class);
    }
    
    /**
     * Get user's tenant list by Keycloak user ID
     */
    public UserTenantCacheData getUserTenantsByKeycloakId(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isEmpty()) {
            return null;
        }
        return cacheService.get(CacheType.USER_TENANT, String.format("keycloak:%s", keycloakUserId), UserTenantCacheData.class);
    }
    
    /**
     * Get user's tenant list by user ID with cache-aside pattern
     */
    public UserTenantCacheData getUserTenants(Long userId, Supplier<UserTenantCacheData> loader) {
        if (userId == null) {
            return null;
        }
        return cacheService.getOrLoad(CacheType.USER_TENANT, String.format("user:%s", userId), loader, UserTenantCacheData.class);
    }
    
    /**
     * Get user's tenant list by Keycloak ID with cache-aside pattern
     */
    public UserTenantCacheData getUserTenantsByKeycloakId(String keycloakUserId, Supplier<UserTenantCacheData> loader) {
        if (keycloakUserId == null || keycloakUserId.isEmpty()) {
            return null;
        }
        return cacheService.getOrLoad(CacheType.USER_TENANT, String.format("keycloak:%s", keycloakUserId), loader, UserTenantCacheData.class);
    }
    
    /**
     * Cache user-tenant mapping
     */
    public void cacheUserTenants(UserTenantCacheData userTenants) {
        if (userTenants == null) {
            return;
        }
        
        userTenants.setCachedAt(java.time.Instant.now());
        
        // Cache by user ID
        if (userTenants.getUserId() != null) {
            cacheService.put(CacheType.USER_TENANT, String.format("user:%s", userTenants.getUserId()), userTenants);
        }
        
        // Cache by Keycloak user ID
        if (userTenants.getKeycloakUserId() != null && !userTenants.getKeycloakUserId().isEmpty()) {
            cacheService.put(CacheType.USER_TENANT, String.format("keycloak:%s", userTenants.getKeycloakUserId()), userTenants);
        }
        
        log.debug("Cached user-tenant mapping for user: {} (Keycloak: {})", 
                userTenants.getUserId(), userTenants.getKeycloakUserId());
    }
    
    /**
     * Invalidate user-tenant cache by user ID
     */
    public void invalidateUser(Long userId) {
        if (userId == null) {
            return;
        }
        cacheService.delete(CacheType.USER_TENANT, String.format("user:%s", userId));
        log.debug("Invalidated user-tenant cache for user ID: {}", userId);
    }
    
    /**
     * Invalidate user-tenant cache by Keycloak user ID
     */
    public void invalidateUserByKeycloakId(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isEmpty()) {
            return;
        }
        cacheService.delete(CacheType.USER_TENANT, String.format("keycloak:%s", keycloakUserId));
        log.debug("Invalidated user-tenant cache for Keycloak user ID: {}", keycloakUserId);
    }
}
