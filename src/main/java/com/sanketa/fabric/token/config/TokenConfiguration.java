package com.sanketa.fabric.token.config;

import com.sanketa.fabric.token.key.KeyStore;
import com.sanketa.fabric.vault.service.VaultKeyStoreLoader;
import com.sanketa.fabric.token.TenantContextStore;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.KeyPair;

/**
 * Configuration for Tenant Context Token system
 * 
 * @author mumei
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class TokenConfiguration {
    
    private final KeyStore keyStore;
    
    @Autowired(required = true)
    private VaultKeyStoreLoader vaultKeyStoreLoader;
    
    @Value("${fabric.token.key-id:default}")
    private String keyId;
    
    // HashiCorp Vault is required for all environments
    @Value("${fabric.vault.enabled:true}")
    private boolean vaultEnabled;
    
    @Value("${fabric.token.vault.key-id:default}")
    private String vaultKeyId;
    
    /**
     * Initialize keys from HashiCorp Vault
     * 
     * Keys are always loaded from HashiCorp Vault for all environments.
     * For local development, run Vault via Docker or connect to a dev Vault instance.
     */
    @Bean
    public KeyStoreInitializer keyStoreInitializer() {
        KeyStoreInitializer initializer = new KeyStoreInitializer();
        initializer.initialize();
        return initializer;
    }
    
    /**
     * Filter to clear TenantContextStore after request
     * 
     * This filter runs last (highest order) to ensure TenantContext is cleared
     * after all request processing is complete.
     */
    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    public OncePerRequestFilter tenantContextCleanupFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                try {
                    filterChain.doFilter(request, response);
                } finally {
                    TenantContextStore.clearContext();
                }
            }
        };
    }
    
    /**
     * Initialize KeyStore with keys from HashiCorp Vault
     * 
     * Keys are always loaded from HashiCorp Vault for all environments (dev, staging, production).
     * This ensures consistent behavior and centralized key management across all environments.
     */
    private class KeyStoreInitializer {
        
        public void initialize() {
            try {
                if (!vaultEnabled) {
                    throw new IllegalStateException("HashiCorp Vault is required but not enabled. " +
                        "Set fabric.vault.enabled=true and configure Vault connection.");
                }
                
                if (vaultKeyStoreLoader == null) {
                    throw new IllegalStateException("VaultKeyStoreLoader is not available. " +
                        "Ensure Vault configuration is properly set up.");
                }
                
                loadFromVault();
                
            } catch (Exception e) {
                log.error("Failed to initialize KeyStore from HashiCorp Vault", e);
                throw new IllegalStateException("Failed to initialize KeyStore from HashiCorp Vault. " +
                    "Ensure Vault is running and properly configured. " +
                    "For local development, run: docker run -d --name vault -p 8200:8200 vault", e);
            }
        }
        
        /**
         * Load keys from HashiCorp Vault
         * 
         * This method loads keys from Vault for all environments.
         * Vault provides centralized key management, security, and supports key rotation.
         */
        private void loadFromVault() throws Exception {
            log.info("Loading keys from HashiCorp Vault (keyId: {})", vaultKeyId);
            
            if (!vaultKeyStoreLoader.isVaultAccessible()) {
                throw new IllegalStateException("Vault is not accessible. Check Vault configuration and connectivity. " +
                    "Verify fabric.vault.* settings in application.yml");
            }
            
            // Load key pair from Vault
            KeyPair keyPair = vaultKeyStoreLoader.loadKeyPairFromVault(vaultKeyId);
            
            keyStore.registerSigningKey(keyId, keyPair.getPrivate());
            keyStore.registerVerificationKey(keyId, keyPair.getPublic());
            keyStore.setDefaultKeyId(keyId);
            
            log.info("Successfully loaded keys from Vault with keyId: {}", keyId);
            
            // Optionally load all keys for rotation support
            try {
                var allKeyPairs = vaultKeyStoreLoader.loadAllKeyPairs();
                for (var entry : allKeyPairs.entrySet()) {
                    if (!entry.getKey().equals(vaultKeyId)) {
                        keyStore.registerSigningKey(entry.getKey(), entry.getValue().getPrivate());
                        keyStore.registerVerificationKey(entry.getKey(), entry.getValue().getPublic());
                    }
                }
                log.info("Loaded {} additional keys from Vault for rotation support", allKeyPairs.size() - 1);
            } catch (Exception e) {
                log.warn("Failed to load all keys from Vault (rotation support may be limited): {}", e.getMessage());
            }
        }
    }
}
