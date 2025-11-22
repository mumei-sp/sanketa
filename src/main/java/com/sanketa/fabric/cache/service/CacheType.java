package com.sanketa.fabric.cache.service;

import lombok.Getter;

/**
 * Enum defining cache types with their respective prefixes and configurations.
 * 
 * @author mumei
 */
@Getter
public enum CacheType {
    /**
     * Tenant-specific cache
     */
    TENANT("tenant"),
    
    /**
     * User-tenant mapping cache
     */
    USER_TENANT("user-tenant"),
    
    /**
     * Global/shared data cache
     */
    GLOBAL("global");
    
    private final String keyPrefix;
    
    CacheType(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }
}
