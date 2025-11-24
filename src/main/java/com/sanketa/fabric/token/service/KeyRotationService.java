package com.sanketa.fabric.token.service;

import com.sanketa.fabric.token.key.Ed25519KeyManager;
import com.sanketa.fabric.token.key.KeyIdUtil;
import com.sanketa.fabric.token.key.KeyStore;
import com.sanketa.fabric.token.key.KeyStoreException;
import com.sanketa.fabric.vault.service.VaultKeyStoreLoader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Key Rotation Service
 *
 * @author mumei
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "fabric.token.key-rotation.enabled", havingValue = "true")
public class KeyRotationService {
    
    private final KeyStore keyStore;
    private final VaultKeyStoreLoader vaultKeyStoreLoader;
    private final Ed25519KeyManager keyManager;
    private final KeyIdUtil keyIdUtil;
    
    @Value("${fabric.token.key-rotation.cleanup-period-days:90}")
    private int cleanupPeriodDays;
    
    @Value("${fabric.token.key-id:default}")
    private String defaultKeyId;
    
    /**
     * Map of keyId -> rotation timestamp
     * Tracks when each key was rotated (when it became non-default)
     */
    private final Map<String, Instant> keyRotationTimestamps = new ConcurrentHashMap<>();
    
    @Value("${fabric.token.key-rotation.rotation-interval-days:30}")
    private int rotationIntervalDays;
    
    @Value("${fabric.token.key-rotation.strategy:scheduled}")
    private String rotationStrategy;
    
    /**
     * Track when the default key was last rotated
     */
    private Instant lastRotationTime;
    
    /**
     * Record that a key was rotated (became non-default)
     * 
     * @param oldKeyId The key ID that was replaced (now old)
     */
    public void recordKeyRotation(String oldKeyId) {
        if (oldKeyId != null && !oldKeyId.equals(defaultKeyId)) {
            keyRotationTimestamps.put(oldKeyId, Instant.now());
            log.info("Recorded rotation timestamp for old key: {} at {}", oldKeyId, Instant.now());
        }
        lastRotationTime = Instant.now();
    }
    
    /**
     * Check if key rotation is needed based on rotation interval
     */
    public boolean isRotationNeeded() {
        if (lastRotationTime == null) {
            // First rotation - check if key exists and is old enough
            // For now, assume rotation is needed if no timestamp exists
            return true;
        }
        
        Instant nextRotationTime = lastRotationTime.plus(rotationIntervalDays, ChronoUnit.DAYS);
        return Instant.now().isAfter(nextRotationTime);
    }
    
    /**
     * This method runs daily and:
     * 1. Checks if rotation is needed (30 days passed) and rotates if needed
     * 2. Cleans up old keys from both in-memory and Vault (after 60-90 days)
     */
    @Scheduled(cron = "${fabric.token.key-rotation.rotation-cron:0 0 2 * * ?}") // Daily at 2 AM
    public void rotationAndCleanupTask() {
        log.info("Starting combined rotation and cleanup task");
        
        performRotationIfNeeded();
        cleanupOldKeys();
        
        log.info("Completed combined rotation and cleanup task");
    }
    
    /**
     * Performs key rotation if conditions are met.
     */
    private void performRotationIfNeeded() {
        if (!shouldPerformRotation()) {
            return;
        }
        
        try {
            performKeyRotation();
        } catch (Exception e) {
            log.error("Failed to perform automatic key rotation", e);
            // Don't throw - allow retry on next scheduled run
        }
    }
    
    /**
     * Determines if key rotation should be performed.
     */
    private boolean shouldPerformRotation() {
        if (!isScheduledRotationStrategy()) {
            log.debug("Rotation strategy is not 'scheduled', skipping automatic rotation check");
            return false;
        }
        
        if (!isRotationNeeded()) {
            logRotationNotNeeded();
            return false;
        }
        
        return true;
    }
    
    /**
     * Checks if the rotation strategy is set to 'scheduled'.
     */
    private boolean isScheduledRotationStrategy() {
        return "scheduled".equalsIgnoreCase(rotationStrategy);
    }
    
    /**
     * Logs that rotation is not needed yet with timing information.
     */
    private void logRotationNotNeeded() {
        Instant nextRotationTime = lastRotationTime != null 
                ? lastRotationTime.plus(rotationIntervalDays, ChronoUnit.DAYS)
                : null;
        log.debug("Key rotation not needed yet. Last rotation: {}, Next rotation: {}", 
                lastRotationTime, nextRotationTime);
    }
    
    /**
     * Performs the actual key rotation process.
     */
    private void performKeyRotation() {
        log.info("Key rotation needed ({} days since last rotation). Starting rotation...", rotationIntervalDays);
        
        String oldKeyId = keyStore.getDefaultKeyId();
        String newKeyId = generateNewKeyId();
        KeyPair newKeyPair = generateAndStoreNewKey(newKeyId);
        registerNewKeyInStore(newKeyId, newKeyPair);
        setNewKeyAsDefault(newKeyId);
        recordKeyRotation(oldKeyId);
        
        log.info("Successfully rotated key from '{}' to '{}'", oldKeyId, newKeyId);
    }
    
    /**
     * Generates a new key ID using the standardized format.
     */
    private String generateNewKeyId() {
        return keyIdUtil.generateKeyId();
    }
    
    /**
     * Generates a new key pair and stores it in Vault using Transit Engine hybrid approach.
     */
    private KeyPair generateAndStoreNewKey(String keyId) {
        if (vaultKeyStoreLoader == null) {
            throw new IllegalStateException("VaultKeyStoreLoader is not available");
        }
        return vaultKeyStoreLoader.rotateKeyViaTransit(keyId);
    }
    
    /**
     * Registers the new key pair in the KeyStore.
     */
    private void registerNewKeyInStore(String keyId, KeyPair keyPair) {
        keyStore.registerSigningKey(keyId, keyPair.getPrivate());
        keyStore.registerVerificationKey(keyId, keyPair.getPublic());
    }
    
    /**
     * Sets the new key as the default key in KeyStore.
     */
    private void setNewKeyAsDefault(String keyId) {
        keyStore.setDefaultKeyId(keyId);
    }
    
    /**
     * Cleans up old keys that have exceeded the cleanup period.
     * 
     * Note: Tokens have a TTL (default 15 minutes), so after cleanup period (60-90 days),
     * all tokens signed with old keys should have expired.
     */
    private void cleanupOldKeys() {
        log.info("Starting cleanup of old keys (cleanup period: {} days)", cleanupPeriodDays);
        
        CleanupResult result = performCleanup();
        
        log.info("Completed cleanup: removed {} key(s) from memory, {} key(s) from Vault", 
                result.getRemovedFromMemory(), result.getRemovedFromVault());
    }
    
    /**
     * Performs the cleanup operation and returns the result.
     */
    private CleanupResult performCleanup() {
        Set<String> allKeyIds = collectAllKeyIds();
        Set<String> inMemoryKeyIds = keyStore.getAllSigningKeyIds();
        Set<String> vaultKeyIds = getAllVaultKeyIds();
        Instant cutoffTime = calculateCleanupCutoffTime();
        
        CleanupResult result = new CleanupResult();
        
        for (String keyId : allKeyIds) {
            if (shouldSkipKeyForCleanup(keyId)) {
                continue;
            }
            
            if (isKeyEligibleForCleanup(keyId, cutoffTime)) {
                cleanupKey(keyId, inMemoryKeyIds, vaultKeyIds, result);
            }
        }
        
        return result;
    }
    
    /**
     * Collects all key IDs from both in-memory KeyStore and Vault.
     */
    private Set<String> collectAllKeyIds() {
        Set<String> inMemoryKeyIds = keyStore.getAllSigningKeyIds();
        Set<String> vaultKeyIds = getAllVaultKeyIds();
        
        Set<String> allKeyIds = new HashSet<>(inMemoryKeyIds);
        allKeyIds.addAll(vaultKeyIds);
        
        return allKeyIds;
    }
    
    /**
     * Calculates the cutoff time for key cleanup.
     * Keys rotated before this time are eligible for cleanup.
     */
    private Instant calculateCleanupCutoffTime() {
        return Instant.now().minus(cleanupPeriodDays, ChronoUnit.DAYS);
    }
    
    /**
     * Determines if a key should be skipped during cleanup.
     */
    private boolean shouldSkipKeyForCleanup(String keyId) {
        return keyId.equals(defaultKeyId);
    }
    
    /**
     * Checks if a key is eligible for cleanup based on its rotation timestamp.
     */
    private boolean isKeyEligibleForCleanup(String keyId, Instant cutoffTime) {
        Instant rotationTime = keyRotationTimestamps.get(keyId);
        
        if (rotationTime == null) {
            // Key exists but no rotation timestamp - might be from before rotation tracking
            // For safety, we'll skip keys without timestamps
            log.debug("Key '{}' has no rotation timestamp, skipping cleanup", keyId);
            return false;
        }
        
        return rotationTime.isBefore(cutoffTime);
    }
    
    /**
     * Cleans up a single key from both in-memory KeyStore and Vault.
     */
    private void cleanupKey(String keyId, Set<String> inMemoryKeyIds, Set<String> vaultKeyIds, 
            CleanupResult result) {
        Instant rotationTime = keyRotationTimestamps.get(keyId);
        log.info("Removing old key '{}' (rotated at {}, cleanup period exceeded)", keyId, rotationTime);
        
        try {
            if (inMemoryKeyIds.contains(keyId)) {
                removeKeyFromMemory(keyId, result);
            }
            
            if (vaultKeyIds.contains(keyId)) {
                removeKeyFromVault(keyId, result);
            }
            
            keyRotationTimestamps.remove(keyId);
            
        } catch (Exception e) {
            log.warn("Error during cleanup of key '{}': {}", keyId, e.getMessage());
        }
    }
    
    /**
     * Removes a key from the in-memory KeyStore.
     */
    private void removeKeyFromMemory(String keyId, CleanupResult result) {
        try {
            keyStore.removeKey(keyId);
            result.incrementRemovedFromMemory();
            log.info("Removed key '{}' from in-memory KeyStore", keyId);
        } catch (KeyStoreException e) {
            log.warn("Could not remove key '{}' from in-memory: {}", keyId, e.getMessage());
        }
    }
    
    /**
     * Removes a key from Vault KV store.
     */
    private void removeKeyFromVault(String keyId, CleanupResult result) {
        try {
            vaultKeyStoreLoader.deleteKeyFromVault(keyId);
            result.incrementRemovedFromVault();
            log.info("Removed key '{}' from Vault KV", keyId);
        } catch (Exception e) {
            log.warn("Could not remove key '{}' from Vault: {}", keyId, e.getMessage());
        }
    }
    
    /**
     * Gets all key IDs from Vault.
     */
    private Set<String> getAllVaultKeyIds() {
        try {
            Map<String, KeyPair> allKeyPairs = vaultKeyStoreLoader.loadAllKeyPairs();
            return new HashSet<>(allKeyPairs.keySet());
        } catch (Exception e) {
            log.warn("Failed to get key IDs from Vault: {}", e.getMessage());
            return new HashSet<>();
        }
    }
    
    /**
     * Internal class to track cleanup operation results.
     */
    private static class CleanupResult {
        private int removedFromMemory = 0;
        private int removedFromVault = 0;
        
        void incrementRemovedFromMemory() {
            removedFromMemory++;
        }
        
        void incrementRemovedFromVault() {
            removedFromVault++;
        }
        
        int getRemovedFromMemory() {
            return removedFromMemory;
        }
        
        int getRemovedFromVault() {
            return removedFromVault;
        }
    }
    
    /**
     * Manually trigger rotation and cleanup
     */
    public String triggerRotationAndCleanup() {
        log.info("Manual rotation and cleanup triggered");
        rotationAndCleanupTask();
        return String.format("Rotation and cleanup completed. Tracked keys: %d", keyRotationTimestamps.size());
    }
    
    /**
     * Manually trigger cleanup of old keys only
     */
    public String cleanupOldKeysNow() {
        log.info("Manual cleanup triggered");
        cleanupOldKeys();
        return String.format("Cleanup completed. Tracked keys: %d", keyRotationTimestamps.size());
    }
    
    /**
     * Get rotation timestamp for a key
     */
    public Instant getRotationTimestamp(String keyId) {
        return keyRotationTimestamps.get(keyId);
    }
    
    /**
     * Get all tracked rotation timestamps
     */
    public Map<String, Instant> getAllRotationTimestamps() {
        return new HashMap<>(keyRotationTimestamps);
    }
}
