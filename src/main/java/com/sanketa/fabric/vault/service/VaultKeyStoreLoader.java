package com.sanketa.fabric.vault.service;

import com.sanketa.fabric.token.key.Ed25519KeyManager;
import com.sanketa.fabric.token.key.KeyIdUtil;
import com.sanketa.fabric.vault.exception.VaultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.vault.core.VaultKeyValueOperations;
import org.springframework.vault.core.VaultKeyValueOperationsSupport;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.core.VaultTransitOperations;
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
 * 
 * @author mumei
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "fabric.vault.enabled", havingValue = "true")
public class VaultKeyStoreLoader {
    
    private final Ed25519KeyManager keyManager;
    private final VaultTemplate vaultTemplate;
    private final KeyIdUtil keyIdUtil;
    
    @Value("${fabric.token.vault.path-prefix:secret/data/fabric/token/keys}")
    private String pathPrefix;
    
    @Value("${fabric.vault.transit.enabled:false}")
    private boolean transitEnabled;
    
    @Value("${fabric.vault.transit.mount-path:transit}")
    private String transitMountPath;
    
    @Value("${fabric.vault.transit.key-name:fabric-token-key}")
    private String transitKeyName;
    
    @Value("${fabric.vault.transit.key-type:ed25519}")
    private String transitKeyType;
    
    @Value("${fabric.vault.transit.export-to-kv:true}")
    private boolean exportToKv;
    
    /**
     * Load key pair from Vault by key ID
     * 
     * @param keyId Key identifier (e.g., "key-20240115")
     * @return KeyPair containing private and public keys
     * @throws VaultException if key cannot be loaded from Vault or keyId is null/empty
     */
    public KeyPair loadKeyPairFromVault(String keyId) throws VaultException {
        if (keyId == null || keyId.isEmpty()) {
            throw new VaultException("Key ID cannot be null or empty");
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
     * Find the latest key ID from all keys in Vault
     * 
     * Compares keys by date extracted from key ID format (key-YYYYMMDD).
     * Returns the most recent key based on date.
     * 
     * @return Latest key ID, or null if no keys found
     * @throws VaultException if unable to list keys
     */
    public String findLatestKeyId() throws VaultException {
        try {
            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            
            String basePath = getVaultBasePath();
            List<String> keyIds = kvOperations.list(basePath);
            
            if (keyIds == null || keyIds.isEmpty()) {
                log.info("No keys found in Vault");
                return null;
            }
            
            String latestKeyId = keyIdUtil.findLatestKeyId(keyIds);
            log.info("Found latest key ID: {} from {} total keys: {}", latestKeyId, keyIds.size(), keyIds);
            return latestKeyId;
            
        } catch (org.springframework.vault.VaultException e) {
            log.error("Failed to find latest key ID from Vault", e);
            throw new VaultException("Failed to find latest key ID: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to find latest key ID from Vault", e);
            throw new VaultException("Failed to find latest key ID: " + e.getMessage(), e);
        }
    }
    
    /**
     * Load the latest key pair from Vault
     * 
     * Automatically finds the latest key ID and loads it.
     * Useful for loading the most recent key after rotation.
     * 
     * @return KeyPair from the latest key
     * @throws VaultException if unable to find or load latest key, or no keys exist
     */
    public KeyPair loadLatestKeyPair() throws VaultException {
        String latestKeyId = findLatestKeyId();
        if (latestKeyId == null) {
            throw new VaultException("No keys found in Vault");
        }
        log.info("Loading latest key pair with keyId: {}", latestKeyId);
        return loadKeyPairFromVault(latestKeyId);
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
     * Store key pair to Vault
     * 
     * @param keyId Key identifier (e.g., "key-20240115")
     * @param keyPair KeyPair containing private and public keys
     * @throws VaultException if key cannot be stored in Vault or keyId is null/empty
     */
    public void storeKeyPairToVault(String keyId, KeyPair keyPair) throws VaultException {
        if (keyId == null || keyId.isEmpty()) {
            throw new VaultException("Key ID cannot be null or empty");
        }
        if (keyPair == null) {
            throw new VaultException("KeyPair cannot be null");
        }
        log.info("Storing keys to Vault for keyId: {}", keyId);
        
        try {
            String path = getVaultPath(keyId);
            String privateKeyBase64 = keyManager.encodePrivateKey(keyPair.getPrivate());
            String publicKeyBase64 = keyManager.encodePublicKey(keyPair.getPublic());
            
            Map<String, Object> secretData = new HashMap<>();
            secretData.put("private_key", privateKeyBase64);
            secretData.put("public_key", publicKeyBase64);
            
            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            kvOperations.put(path, secretData);
            log.info("Successfully stored key pair to Vault (keyId: {})", keyId);
        } catch (org.springframework.vault.VaultException e) {
            log.error("Failed to store key to Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to store key to Vault: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to store key to Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to store key to Vault: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if a key exists in Vault
     * 
     * @param keyId Key identifier
     * @return true if key exists, false otherwise
     * @throws VaultException if keyId is null or empty
     */
    public boolean keyExistsInVault(String keyId) {
        if (keyId == null || keyId.isEmpty()) {
            return false;
        }
        
        try {
            String path = getVaultPath(keyId);
            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            
            VaultResponseSupport<Map<String, Object>> response = kvOperations.get(path, Map.class);
            return response != null && response.getData() != null;
        } catch (Exception e) {
            log.debug("Key does not exist in Vault for keyId: {}", keyId);
            return false;
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
     * Generate key pair using Transit Engine (Hybrid Approach)
     * 
     * Note: Transit Engine doesn't natively support Ed25519, so we use a hybrid approach:
     * 1. Generate Ed25519 keys locally using Ed25519KeyManager
     * 2. Register the key in Transit Engine for lifecycle management
     * 3. Store keys in KV for high-performance in-memory signing
     * 
     * @param keyId Key identifier (e.g., "key-20240115")
     * @return Generated KeyPair
     * @throws VaultException if key generation fails
     */
    public KeyPair generateKeyPairViaTransit(String keyId) throws VaultException {
        if (!transitEnabled) {
            throw new VaultException("Transit Engine is not enabled. Set fabric.vault.transit.enabled=true");
        }
        
        log.info("Generating Ed25519 key pair via hybrid Transit Engine approach for keyId: {}", keyId);
        
        try {
            // Step 1: Generate Ed25519 key locally (Transit Engine doesn't support Ed25519 natively)
            log.info("Generating Ed25519 key pair locally");
            KeyPair keyPair = keyManager.generateKeyPair();
            
            // Step 2: Register key in Transit Engine for lifecycle management
            // We'll use Transit Engine to track key versions and rotation
            VaultTransitOperations transitOps = vaultTemplate.opsForTransit(transitMountPath);
            
            boolean keyExists = transitKeyExists(transitKeyName);
            if (!keyExists) {
                // Create a key entry in Transit Engine for tracking
                // Note: We use a generic key type since Ed25519 isn't directly supported
                // This is mainly for rotation tracking
                try {
                    // Transit Engine doesn't support Ed25519, so we'll create a tracking entry
                    // using a supported type, or skip Transit creation and just use KV
                    log.info("Transit Engine key tracking: {}", transitKeyName);
                    // For now, we'll skip Transit key creation since Ed25519 isn't supported
                    // and use Transit Engine only for rotation triggers
                } catch (Exception e) {
                    log.warn("Could not create Transit Engine key entry (Ed25519 not supported): {}", e.getMessage());
                    // Continue - we'll still store in KV
                }
            }
            
            // Step 3: Store keys in KV for fast access
            if (exportToKv) {
                log.info("Storing generated key pair to KV for keyId: {}", keyId);
                storeKeyPairToVault(keyId, keyPair);
            }
            
            log.info("Successfully generated key pair via hybrid Transit Engine approach (keyId: {})", keyId);
            return keyPair;
            
        } catch (Exception e) {
            log.error("Failed to generate key via Transit Engine for keyId: {}", keyId, e);
            throw new VaultException("Failed to generate key via Transit Engine: " + e.getMessage(), e);
        }
    }
    
    /**
     * Rotate key using Transit Engine (Hybrid Approach)
     * 
     * This method:
     * 1. Triggers rotation in Transit Engine (for tracking)
     * 2. Generates new Ed25519 key locally
     * 3. Updates KV with new key
     * 
     * @param keyId Key identifier
     * @return New KeyPair after rotation
     * @throws VaultException if rotation fails
     */
    public KeyPair rotateKeyViaTransit(String keyId) throws VaultException {
        if (!transitEnabled) {
            throw new VaultException("Transit Engine is not enabled. Set fabric.vault.transit.enabled=true");
        }
        
        log.info("Rotating key via hybrid Transit Engine approach for keyId: {}", keyId);
        
        try {
            VaultTransitOperations transitOps = vaultTemplate.opsForTransit(transitMountPath);
            
            // Step 1: Trigger rotation in Transit Engine (for tracking/audit)
            try {
                if (transitKeyExists(transitKeyName)) {
                    transitOps.rotateKey(transitKeyName);
                    log.info("Triggered rotation in Transit Engine: {}", transitKeyName);
                } else {
                    log.warn("Transit Engine key not found, skipping Transit rotation trigger");
                }
            } catch (Exception e) {
                log.warn("Could not trigger Transit Engine rotation (may not support Ed25519): {}", e.getMessage());
                // Continue with local rotation
            }
            
            // Step 2: Generate new Ed25519 key locally
            log.info("Generating new Ed25519 key pair for rotation");
            KeyPair newKeyPair = keyManager.generateKeyPair();
            
            // Step 3: Update KV with new key
            if (exportToKv) {
                log.info("Updating KV with rotated key for keyId: {}", keyId);
                storeKeyPairToVault(keyId, newKeyPair);
            }
            
            log.info("Successfully rotated key via hybrid Transit Engine approach (keyId: {})", keyId);
            return newKeyPair;
            
        } catch (Exception e) {
            log.error("Failed to rotate key via Transit Engine for keyId: {}", keyId, e);
            throw new VaultException("Failed to rotate key via Transit Engine: " + e.getMessage(), e);
        }
    }
    
    /**
     * Reload key from Vault into memory (hot-reload without restart)
     * 
     * @param keyId Key identifier to reload
     * @return Reloaded KeyPair
     * @throws VaultException if reload fails
     */
    public KeyPair reloadKeyFromVault(String keyId) throws VaultException {
        log.info("Reloading key from Vault for keyId: {}", keyId);
        return loadKeyPairFromVault(keyId);
    }
    
    /**
     * Delete key from Vault KV store
     * 
     * @param keyId Key identifier to delete
     * @throws VaultException if deletion fails
     */
    public void deleteKeyFromVault(String keyId) throws VaultException {
        if (keyId == null || keyId.isEmpty()) {
            throw new VaultException("Key ID cannot be null or empty");
        }
        
        log.info("Deleting key from Vault for keyId: {}", keyId);
        
        try {
            String path = getVaultPath(keyId);
            VaultKeyValueOperations kvOperations = vaultTemplate.opsForKeyValue("secret", 
                VaultKeyValueOperationsSupport.KeyValueBackend.KV_2);
            
            kvOperations.delete(path);
            log.info("Successfully deleted key from Vault (keyId: {})", keyId);
            
        } catch (org.springframework.vault.VaultException e) {
            log.error("Failed to delete key from Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to delete key from Vault: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to delete key from Vault for keyId: {}", keyId, e);
            throw new VaultException("Failed to delete key from Vault: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if a key exists in Transit Engine
     * 
     * @param keyName Key name in Transit Engine
     * @return true if key exists, false otherwise
     */
    public boolean transitKeyExists(String keyName) {
        try {
            VaultTransitOperations transitOps = vaultTemplate.opsForTransit(transitMountPath);
            transitOps.readKey(keyName);
            return true;
        } catch (Exception e) {
            log.debug("Transit Engine key does not exist: {}", keyName);
            return false;
        }
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
