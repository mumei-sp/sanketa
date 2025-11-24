package com.sanketa.fabric.token;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Tenant Context Token
 * 
 * @author mumei
 */
@Data
@Component
@ConfigurationProperties(prefix = "fabric.token")
public class TenantContextTokenProperties {
    
    /**
     * Token time-to-live in seconds
     * Default: 15 minutes (900 seconds)
     * Recommended: 10-20 minutes for security and performance balance
     */
    private long tokenTtlSeconds = 900; // 15 minutes
    
    /**
     * Token header name in HTTP requests
     * Default: X-Tenant-Context-Token
     */
    private String tokenHeaderName = "X-Tenant-Context-Token";
    
    /**
     * Whether to require token for all requests
     * Default: true
     */
    private boolean requireToken = true;
    
    /**
     * List of paths that don't require token
     * Default: /health, /actuator/**
     */
    private String[] publicPaths = {"/health", "/actuator/**"};
    
    /**
     * Vault-specific token configuration
     */
    private Vault vault = new Vault();
    
    @Data
    public static class Vault {
        /**
         * Key ID to use when loading/storing keys from Vault
         */
        private String keyId = "default";
        
        /**
         * Vault path prefix for keys (default: "secret/data/fabric/token/keys")
         */
        private String pathPrefix = "secret/data/fabric/token/keys";
    }
}
