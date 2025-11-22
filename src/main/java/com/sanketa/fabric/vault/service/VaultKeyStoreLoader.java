package com.sanketa.fabric.vault.service;

import com.sanketa.fabric.token.key.Ed25519KeyManager;
import com.sanketa.fabric.vault.exception.VaultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.vault.core.VaultKeyValueOperations;
import org.springframework.vault.core.VaultKeyValueOperationsSupport;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponseSupport;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * HashiCorp Vault Key Store Loader
 * 
 * Loads Ed25519 keys from HashiCorp Vault for horizontally scaled deployments.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "fabric.vault.enabled", havingValue = "true")
public class VaultKeyStoreLoader {
    
    private final Ed25519KeyManager keyManager;
    private final VaultTemplate vaultTemplate;
    
    @Value("${fabric.token.vault.path-prefix:secret/data/fabric/token/keys}")
    private String pathPrefix;
    
    /**
     * Load key pair from Vault by key ID
     * 
     * @param keyId Key identifier (e.g., "default", "key-2024-01")
     * @return KeyPair containing private and public keys
     * @throws VaultException if key cannot be loaded from Vault
     */
    public KeyPair loadKeyPairFromVault(String keyId) throws VaultException {
        if (keyId == null || keyId.isEmpty()) {
            keyId = "default";
        }
        
        log.info("Loading keys from Vault for keyId: {}", keyId);
        
        try {
            String path = getVaultPath(keyId);
            

            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            
            VaultResponseSupport<Map<String, Object>> response = kvOperations.get(path, Map.class);
            if (response == null || response.getData() == null) {
                throw new VaultException("Key not found in Vault for keyId: " + keyId);
            }
            
            Map<String, Object> secret = response.getData();
            String privateKeyBase64 = extractString(secret, "private_key");
            String publicKeyBase64 = extractString(secret, "public_key");
            if (privateKeyBase64 == null || publicKeyBase64 == null) {
                throw new VaultException("Invalid key format in Vault for keyId: " + keyId);
            }

            PrivateKey privateKey = keyManager.decodePrivateKey(privateKeyBase64);
            PublicKey publicKey = keyManager.decodePublicKey(publicKeyBase64);
            log.info("Successfully loaded key pair from Vault (keyId: {})", keyId);
            return new KeyPair(publicKey, privateKey);
            
        } catch (VaultException e) {
            throw e;
        } catch (org.springframework.vault.VaultException e) {
            log.error("Failed to load key from Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to load key from Vault: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to load key from Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to load key from Vault: " + e.getMessage(), e);
        }
    }
    
    /**
     * Load all key pairs from Vault (for key rotation support)
     * 
     * @return Map of keyId -> KeyPair
     */
    public Map<String, KeyPair> loadAllKeyPairs() throws VaultException {
        log.info("Loading all keys from Vault");
        
        try {
            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            
            String basePath = getVaultBasePath();
            List<String> keyIds = kvOperations.list(basePath);
            if (keyIds == null) {
                return new HashMap<>();
            }

            Map<String, KeyPair> keyPairs = new HashMap<>();
            for (String keyId : keyIds) {
                try {
                    KeyPair keyPair = loadKeyPairFromVault(keyId);
                    keyPairs.put(keyId, keyPair);
                    log.info("Loaded key pair for keyId: {}", keyId);
                } catch (Exception e) {
                    log.warn("Failed to load key for keyId: {}", keyId, e);
                }
            }
            return keyPairs;
        } catch (VaultException e) {
            throw e;
        } catch (org.springframework.vault.VaultException e) {
            log.error("Failed to load all keys from Vault", e);
            throw new VaultException("Failed to load all keys from Vault: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to load all keys from Vault", e);
            throw new VaultException("Failed to load all keys from Vault: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if Vault is accessible and authenticated
     */
    public boolean isVaultAccessible() {
        try {
            vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2)
                .get("health-check", Map.class);
            return true;
        } catch (Exception e) {
            log.debug("Vault health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get Vault path for a specific key ID
     * Removes the /data/ prefix as Spring Vault handles it
     */
    private String getVaultPath(String keyId) {
        String fullPath = String.format("%s/%s", pathPrefix, keyId);
        // Remove /data/ prefix for KV v2 (Spring Vault adds it automatically)
        return fullPath.replace("/data/", "/").replace("secret/", "");
    }
    
    /**
     * Get base Vault path for listing keys
     * Removes the /data/ prefix as Spring Vault handles it
     */
    private String getVaultBasePath() {
        // Remove /data/ prefix and secret/ prefix for KV v2
        return pathPrefix.replace("/data/", "/").replace("secret/", "");
    }
    
    /**
     * Extract string value from Vault secret response
     */
    @SuppressWarnings("unchecked")
    private String extractString(Map<String, Object> secret, String key) {
        Object value = secret.get(key);
        if (value instanceof String) {
            return (String) value;
        }
        return null;
    }
}

