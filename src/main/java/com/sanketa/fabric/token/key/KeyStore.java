package com.sanketa.fabric.token.key;

import com.sanketa.fabric.token.exception.TokenErrorCode;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-Memory Key Store
 * Stores signing keys (private) and verification keys (public) by key ID.
 * - Keys are loaded from HashiCorp Vault using {@link com.sanketa.fabric.vault.service.VaultKeyStoreLoader} at application startup.
 * - Supports key rotation by maintaining multiple keys with different KIDs
 * 
 * @see com.sanketa.fabric.vault.service.VaultKeyStoreLoader For loading keys from HashiCorp Vault
 * @see com.sanketa.fabric.token.config.TokenConfiguration For key initialization
 * @author mumei
 */
@Slf4j
@Component
public class KeyStore {
    
    /**
     * In-memory cache of signing keys (private keys) by key ID.
     * Keys are loaded at startup from HashiCorp Vault or configuration.
     */
    private final Map<String, PrivateKey> signingKeys = new ConcurrentHashMap<>();
    
    /**
     * In-memory cache of verification keys (public keys) by key ID.
     * Keys are loaded at startup from HashiCorp Vault or configuration.
     */
    private final Map<String, PublicKey> verificationKeys = new ConcurrentHashMap<>();
    
    /**
     * Default key ID used when kid is not specified in token or request.
     */
    @Getter
    private volatile String defaultKeyId = "default";
    
    /**
     * Register a signing key (private key) in the in-memory cache.
     * 
     * @param keyId Key identifier (e.g., "default", "key-2024-01")
     * @param privateKey Private key for signing tokens
     * @throws KeyStoreException if keyId or privateKey is invalid
     */
    public void registerSigningKey(String keyId, PrivateKey privateKey) {
        validateKeyId(keyId);
        if (privateKey == null) {
            throw new KeyStoreException(TokenErrorCode.KEY_ID_INVALID, 
                    "Private key cannot be null");
        }
        signingKeys.put(keyId, privateKey);
        log.info("Registered signing key with ID: {}", keyId);
    }
    
    /**
     * Register a verification key (public key) in the in-memory cache.
     * 
     * @param keyId Key identifier (e.g., "default", "key-2024-01")
     * @param publicKey Public key for verifying token signatures
     * @throws KeyStoreException if keyId or publicKey is invalid
     */
    public void registerVerificationKey(String keyId, PublicKey publicKey) {
        validateKeyId(keyId);
        if (publicKey == null) {
            throw new KeyStoreException(TokenErrorCode.KEY_ID_INVALID, 
                    "Public key cannot be null");
        }
        verificationKeys.put(keyId, publicKey);
        log.info("Registered verification key with ID: {}", keyId);
    }
    
    /**
     * Get signing key (private key) by key ID.
     * Used by TenantContextTokenService to sign tokens.
     * 
     * @param keyId Key identifier (null or empty uses default)
     * @return Private key for signing
     * @throws KeyStoreException if key is not found
     */
    public PrivateKey getSigningKey(String keyId) {
        String effectiveKeyId = normalizeKeyId(keyId);
        PrivateKey key = signingKeys.get(effectiveKeyId);
        if (key == null) {
            throw new KeyStoreException(TokenErrorCode.SIGNING_KEY_NOT_FOUND, 
                    "Signing key not found for keyId: " + effectiveKeyId);
        }
        return key;
    }
    
    /**
     * Get verification key (public key) by key ID.
     * Used by TenantContextTokenService to verify token signatures.
     * 
     * @param keyId Key identifier (null or empty uses default)
     * @return Public key for verification
     * @throws KeyStoreException if key is not found
     */
    public PublicKey getVerificationKey(String keyId) {
        String effectiveKeyId = normalizeKeyId(keyId);
        PublicKey key = verificationKeys.get(effectiveKeyId);
        if (key == null) {
            throw new KeyStoreException(TokenErrorCode.VERIFICATION_KEY_NOT_FOUND, 
                    "Verification key not found for keyId: " + effectiveKeyId);
        }
        return key;
    }
    
    /**
     * Check if a signing key exists in the cache.
     * 
     * @param keyId Key identifier (null or empty uses default)
     * @return true if signing key exists, false otherwise
     */
    public boolean hasSigningKey(String keyId) {
        String effectiveKeyId = normalizeKeyId(keyId);
        return signingKeys.containsKey(effectiveKeyId);
    }
    
    /**
     * Check if a verification key exists in the cache.
     * Useful for key rotation scenarios to verify key availability.
     * 
     * @param keyId Key identifier (null or empty uses default)
     * @return true if verification key exists, false otherwise
     */
    public boolean hasVerificationKey(String keyId) {
        String effectiveKeyId = normalizeKeyId(keyId);
        return verificationKeys.containsKey(effectiveKeyId);
    }
    
    /**
     * Set the default key ID used when "kid" is not specified.
     * Useful for key rotation - set new default while old keys remain available.
     * 
     * @param keyId Key identifier to set as default
     * @throws KeyStoreException if keyId is invalid or key doesn't exist
     */
    public void setDefaultKeyId(String keyId) {
        validateKeyId(keyId);
        if (!hasSigningKey(keyId) || !hasVerificationKey(keyId)) {
            throw new KeyStoreException(TokenErrorCode.KEY_ID_INVALID, 
                    "Cannot set default keyId '" + keyId + "' - key pair not found in store");
        }
        this.defaultKeyId = keyId;
        log.info("Set default key ID to: {}", keyId);
    }

    /**
     * Remove a key from the cache (useful for key rotation).
     * 
     * After key rotation grace period, old keys can be removed.
     * Only remove keys after ensuring all tokens signed with them have expired.
     * 
     * @param keyId Key identifier to remove
     * @throws KeyStoreException if trying to remove the default key
     */
    public void removeKey(String keyId) {
        validateKeyId(keyId);
        String effectiveKeyId = normalizeKeyId(keyId);
        
        if (effectiveKeyId.equals(defaultKeyId)) {
            throw new KeyStoreException(TokenErrorCode.KEY_ROTATION_FAILED, 
                    "Cannot remove default keyId: " + effectiveKeyId + ". Set a new default first.");
        }
        
        boolean removed = signingKeys.remove(effectiveKeyId) != null || 
                            verificationKeys.remove(effectiveKeyId) != null;
        
        if (removed) {
            log.info("Removed key with ID: {} (ensure all tokens signed with this key have expired)", effectiveKeyId);
        } else {
            log.warn("Attempted to remove non-existent key with ID: {}", effectiveKeyId);
        }
    }
    
    /**
     * Get all key IDs that have signing keys registered.
     * 
     * @return Unmodifiable set of key IDs
     */
    public Set<String> getAllSigningKeyIds() {
        return Collections.unmodifiableSet(signingKeys.keySet());
    }
    
    /**
     * Get all key IDs that have verification keys registered.
     * 
     * @return Unmodifiable set of key IDs
     */
    public Set<String> getAllVerificationKeyIds() {
        return Collections.unmodifiableSet(verificationKeys.keySet());
    }
    
    /**
     * Get count of registered signing keys.
     * 
     * @return Number of signing keys
     */
    public int getSigningKeyCount() {
        return signingKeys.size();
    }
    
    /**
     * Get count of registered verification keys.
     * 
     * @return Number of verification keys
     */
    public int getVerificationKeyCount() {
        return verificationKeys.size();
    }
    
    /**
     * Check if key store is empty (no keys registered).
     * 
     * @return true if no keys are registered
     */
    public boolean isEmpty() {
        return signingKeys.isEmpty() && verificationKeys.isEmpty();
    }
    
    /**
     * Normalize key ID - returns default if null or empty.
     * 
     * @param keyId Key identifier (can be null or empty)
     * @return Normalized key ID
     */
    private String normalizeKeyId(String keyId) {
        return (keyId == null || keyId.trim().isEmpty()) ? defaultKeyId : keyId.trim();
    }
    
    /**
     * Validate that key ID is not null or empty.
     * 
     * @param keyId Key identifier to validate
     * @throws KeyStoreException if keyId is invalid
     */
    private void validateKeyId(String keyId) {
        if (keyId == null || keyId.trim().isEmpty()) {
            throw new KeyStoreException(TokenErrorCode.KEY_ID_INVALID, 
                    "Key ID cannot be null or empty");
        }
    }
}
