package com.sanketa.fabric.vault.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;

/**
 * Vault configuration properties.
 * 
 * @author mumei
 */
@Data
@Validated
@ConfigurationProperties(prefix = "fabric.vault")
public class VaultProperties {
    
    /**
     * Enable Vault integration
     */
    private boolean enabled = false;
    
    /**
     * Vault server address (e.g., https://vault.example.com:8200)
     */
    @NotBlank(message = "Vault address is required when vault is enabled")
    private String address = "http://localhost:8200";
    
    /**
     * Vault namespace (for Vault Enterprise multi-tenancy)
     */
    private String namespace = "";
    
    /**
     * Authentication configuration
     */
    private Auth auth = new Auth();
    
    /**
     * Connection configuration
     */
    private Connection connection = new Connection();
    
    /**
     * TLS/SSL configuration
     */
    private Tls tls = new Tls();
    
    /**
     * Authentication configuration
     */
    @Data
    public static class Auth {
        /**
         * Authentication method: token or approle
         */
        @NotBlank
        private String method = "token";
        
        /**
         * Token authentication
         */
        private TokenAuth token = new TokenAuth();
        
        /**
         * AppRole authentication (for production)
         */
        private AppRoleAuth approle = new AppRoleAuth();
    }
    
    @Data
    public static class TokenAuth {
        /**
         * Vault token (leave empty to use VAULT_TOKEN env var)
         */
        private String token = "";
    }
    
    @Data
    public static class AppRoleAuth {
        /**
         * AppRole role ID (leave empty to use VAULT_ROLE_ID env var)
         */
        private String roleId = "";
        
        /**
         * AppRole secret ID (leave empty to use VAULT_SECRET_ID env var)
         */
        private String secretId = "";
        
        /**
         * AppRole mount path (default: approle)
         */
        private String mountPath = "approle";
    }
    
    /**
     * Connection configuration
     * Spring Vault handles connection pooling automatically
     */
    @Data
    public static class Connection {
        /**
         * Connection timeout (default: 10 seconds)
         */
        private Duration timeout = Duration.ofSeconds(10);
        
        /**
         * Read timeout (default: 30 seconds)
         */
        private Duration readTimeout = Duration.ofSeconds(30);
    }
    
    /**
     * TLS/SSL configuration
     */
    @Data
    public static class Tls {
        /**
         * Enable TLS verification (default: true)
         * Set to false only for development with self-signed certificates
         */
        private boolean verify = true;
    }
}