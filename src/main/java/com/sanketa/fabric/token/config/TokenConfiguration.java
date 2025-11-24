package com.sanketa.fabric.token.config;

import com.sanketa.fabric.token.TenantContextTokenProperties;
import com.sanketa.fabric.token.key.Ed25519KeyManager;
import com.sanketa.fabric.token.key.KeyStore;
import com.sanketa.fabric.token.service.KeyRotationService;
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

import jakarta.annotation.PostConstruct;
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
    private final TenantContextTokenProperties tokenProperties;
    private final Ed25519KeyManager keyManager;
    
    @Autowired(required = false)
    private VaultKeyStoreLoader vaultKeyStoreLoader;
    
    @Autowired(required = false)
    private KeyRotationService keyRotationService;
    
    @Value("${fabric.token.key-id:default}")
    private String keyId;
    
    @Value("${fabric.vault.enabled:true}")
    private boolean vaultEnabled;
    
    @Value("${fabric.token.vault.key-id:default}")
    private String vaultKeyId;
    
    /**
     * Initialize keys from HashiCorp Vault
     */
    @PostConstruct
    public void initializeKeyStore() {
        KeyStoreInitializer initializer = new KeyStoreInitializer();
        initializer.initialize();
    }
    
    /**
     * Filter to clear TenantContextStore after request
     * 
     * This filter runs last (Ordered.LOWEST_PRECEDENCE = Integer.MAX_VALUE) 
     * to ensure TenantContext is cleared after all request processing is complete.
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
     * Initializes KeyStore with keys from HashiCorp Vault.
     * 
     * Keys are always loaded from HashiCorp Vault for all environments (dev, staging, production).
     * This ensures consistent behavior and centralized key management across all environments.
     */
    private class KeyStoreInitializer {

        public void initialize() {
            try {
                validateVaultConfiguration();
                loadPrimaryKey();
                loadRotationKeys();
                log.info("KeyStore initialization completed successfully");
            } catch (IllegalStateException e) {
                log.error("Failed to initialize KeyStore: {}", e.getMessage());
                throw e;
            } catch (Exception e) {
                log.error("Failed to initialize KeyStore from HashiCorp Vault", e);
                throw new IllegalStateException(
                    "Failed to initialize KeyStore from HashiCorp Vault. " +
                    "Ensure Vault is running and properly configured. " +
                    "For local development, run: docker run -d --name vault -p 8200:8200 vault", 
                    e
                );
            }
        }
        
        /**
         * Validates that Vault is enabled and VaultKeyStoreLoader.
         */
        private void validateVaultConfiguration() {
            if (!vaultEnabled) {
                throw new IllegalStateException("HashiCorp Vault is required but not enabled. " +
                    "Set fabric.vault.enabled=true and configure Vault connection."
                );
            }
            if (vaultKeyStoreLoader == null) {
                throw new IllegalStateException("VaultKeyStoreLoader is not available. " +
                    "Ensure Vault configuration is properly set up."
                );
            }
            if (!vaultKeyStoreLoader.isVaultAccessible()) {
                throw new IllegalStateException("Vault is not accessible. Check Vault configuration and connectivity. " +
                        "Verify fabric.vault.* settings in application.yml"
                );
            }
        }
        
        /**
         * Loads the primary key (default key) from Vault.
         * 
         * This method:
         * 1. Auto-detects the latest key from Vault (supports key rotation on restart)
         * 2. Falls back to configured vaultKeyId if no keys exist (cold start)
         * 3. Generates a new key if it doesn't exist in Vault
         * 4. Loads existing key from Vault if it exists
         * 5. Registers the key pair as the default key
         */
        private void loadPrimaryKey() throws Exception {
            log.info("Loading primary key from HashiCorp Vault (configured keyId: {})", vaultKeyId);
            
            String effectiveKeyId = determinePrimaryKeyId();
            KeyPair keyPair = obtainOrGenerateKeyPair(effectiveKeyId);
            registerPrimaryKey(effectiveKeyId, keyPair);
            
            log.info("Primary key loaded successfully (keyId: {})", effectiveKeyId);
        }
        
        /**
         * Determines which key ID to use as the primary key.
         * 
         * Auto-detects the latest key from Vault to support key rotation scenarios.
         * Falls back to configured vaultKeyId if detection fails or no keys exist.
         * 
         * @return The key ID to use as primary key
         */
        private String determinePrimaryKeyId() {
            try {
                String latestKeyId = vaultKeyStoreLoader.findLatestKeyId();
                
                if (latestKeyId != null && !latestKeyId.equals("default")) {
                    log.info("Auto-detected latest key from Vault: {} (configured: {})", latestKeyId, vaultKeyId);
                    return latestKeyId;
                } else {
                    log.info("No keys found in Vault, using configured keyId: {}", vaultKeyId);
                    return vaultKeyId;
                }
            } catch (Exception e) {
                log.warn("Failed to auto-detect latest key from Vault, using configured keyId: {} - {}", 
                        vaultKeyId, e.getMessage());
                return vaultKeyId;
            }
        }
        
        /**
         * Obtains an existing key pair from Vault or generates a new one if it doesn't exist.
         * 
         * @param keyId The key ID to load or generate
         * @return The key pair (either loaded from Vault or newly generated)
         * @throws Exception if key loading or generation fails
         */
        private KeyPair obtainOrGenerateKeyPair(String keyId) throws Exception {
            if (vaultKeyStoreLoader.keyExistsInVault(keyId)) {
                log.info("Loading existing key from Vault (keyId: {})", keyId);
                return vaultKeyStoreLoader.loadKeyPairFromVault(keyId);
            } else {
                log.info("Key '{}' not found in Vault. Generating new key via Transit Engine hybrid approach", keyId);
                return vaultKeyStoreLoader.generateKeyPairViaTransit(keyId);
            }
        }
        
        /**
         * Registers the primary key pair in KeyStore and sets it as the default.
         * 
         * Also records key rotation if the default key has changed.
         * 
         * @param keyId The key ID to register
         * @param keyPair The key pair to register
         */
        private void registerPrimaryKey(String keyId, KeyPair keyPair) {
            String previousDefaultKeyId = keyStore.getDefaultKeyId();
            
            keyStore.registerSigningKey(keyId, keyPair.getPrivate());
            keyStore.registerVerificationKey(keyId, keyPair.getPublic());
            keyStore.setDefaultKeyId(keyId);
            
            recordKeyRotationIfNeeded(previousDefaultKeyId, keyId);
            log.info("Registered primary key pair in KeyStore (keyId: {})", keyId);
        }
        
        /**
         * Records key rotation if the default key has changed.
         * 
         * @param previousKeyId The previous default key ID
         * @param newKeyId The new default key ID
         */
        private void recordKeyRotationIfNeeded(String previousKeyId, String newKeyId) {
            if (keyRotationService != null 
                    && !newKeyId.equals(previousKeyId) 
                    && !previousKeyId.equals("default")) {
                keyRotationService.recordKeyRotation(previousKeyId);
                log.info("Recorded key rotation: {} -> {}", previousKeyId, newKeyId);
            }
        }
        
        /**
         * Loads all additional keys from Vault for rotation support.
         * 
         * This allows the system to verify tokens signed with older keys during
         * the rotation grace period. Keys are loaded in a best-effort manner;
         * failures are logged but don't prevent initialization.
         */
        private void loadRotationKeys() {
            try {
                var allKeyPairs = vaultKeyStoreLoader.loadAllKeyPairs();
                String primaryKeyId = keyStore.getDefaultKeyId();
                
                int additionalKeysLoaded = 0;
                for (var entry : allKeyPairs.entrySet()) {
                    String rotationKeyId = entry.getKey();
                    if (!rotationKeyId.equals(primaryKeyId)) {
                        keyStore.registerSigningKey(rotationKeyId, entry.getValue().getPrivate());
                        keyStore.registerVerificationKey(rotationKeyId, entry.getValue().getPublic());
                        additionalKeysLoaded++;
                    }
                }
                
                if (additionalKeysLoaded > 0) {
                    log.info("Loaded {} additional key(s) from Vault for rotation support", additionalKeysLoaded);
                } else {
                    log.debug("No additional keys found in Vault for rotation support");
                }
            } catch (Exception e) {
                log.warn("Failed to load rotation keys from Vault (rotation support may be limited): {}", 
                        e.getMessage());
            }
        }
    }
}
