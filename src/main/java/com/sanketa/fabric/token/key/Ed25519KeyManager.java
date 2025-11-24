package com.sanketa.fabric.token.key;

import com.sanketa.fabric.token.exception.TokenErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;

import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Ed25519 Key Manager
 * Handles generation, encoding, and decoding of Ed25519 key pairs for PASETO signing.
 * 
 * @author mumei
 */
@Slf4j
@Component
public class Ed25519KeyManager {
    
    static {
        // Register BouncyCastle provider for Ed25519 support
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }
    
    private static final String ALGORITHM = "Ed25519";
    private static final String KEY_PAIR_GENERATOR_ALGORITHM = "Ed25519";
    
    /**
     * Generate a new Ed25519 key pair
     * 
     * @return Generated key pair
     * @throws KeyStoreException if key generation fails
     */
    public KeyPair generateKeyPair() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(
                    KEY_PAIR_GENERATOR_ALGORITHM, BouncyCastleProvider.PROVIDER_NAME);
            keyPairGenerator.initialize(new ECGenParameterSpec(ALGORITHM), new SecureRandom());
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            
            log.info("Generated new Ed25519 key pair");
            return keyPair;
        } catch (NoSuchAlgorithmException e) {
            log.error("Ed25519 algorithm not available", e);
            throw new KeyStoreException(TokenErrorCode.KEY_GENERATION_FAILED, 
                    "Ed25519 algorithm not available. Ensure BouncyCastle provider is properly configured.", e);
        } catch (InvalidAlgorithmParameterException e) {
            log.error("Invalid algorithm parameters for Ed25519 key generation", e);
            throw new KeyStoreException(TokenErrorCode.KEY_GENERATION_FAILED, 
                    "Invalid algorithm parameters for Ed25519 key generation", e);
        } catch (Exception e) {
            log.error("Unexpected error during key pair generation", e);
            throw new KeyStoreException(TokenErrorCode.KEY_GENERATION_FAILED, 
                    "Failed to generate Ed25519 key pair", e);
        }
    }
    
    /**
     * Encode private key to Base64 string
     * 
     * @param privateKey Private key to encode
     * @return Base64 encoded private key
     * @throws KeyStoreException if privateKey is null or encoding fails
     */
    public String encodePrivateKey(PrivateKey privateKey) {
        if (privateKey == null) {
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Private key cannot be null");
        }
        try {
            byte[] encoded = privateKey.getEncoded();
            if (encoded == null || encoded.length == 0) {
                throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                        "Private key encoding returned empty data");
            }
            return Base64.getEncoder().encodeToString(encoded);
        } catch (Exception e) {
            log.error("Failed to encode private key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Failed to encode private key to Base64", e);
        }
    }
    
    /**
     * Encode public key to Base64 string
     * 
     * @param publicKey Public key to encode
     * @return Base64 encoded public key
     * @throws KeyStoreException if publicKey is null or encoding fails
     */
    public String encodePublicKey(PublicKey publicKey) {
        if (publicKey == null) {
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Public key cannot be null");
        }
        try {
            byte[] encoded = publicKey.getEncoded();
            if (encoded == null || encoded.length == 0) {
                throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                        "Public key encoding returned empty data");
            }
            return Base64.getEncoder().encodeToString(encoded);
        } catch (Exception e) {
            log.error("Failed to encode public key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Failed to encode public key to Base64", e);
        }
    }
    
    /**
     * Decode Base64 string to private key
     * 
     * @param encodedKey Base64 encoded private key
     * @return Decoded private key
     * @throws KeyStoreException if encodedKey is invalid or decoding fails
     */
    public PrivateKey decodePrivateKey(String encodedKey) {
        if (encodedKey == null || encodedKey.trim().isEmpty()) {
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Encoded private key cannot be null or empty");
        }
        
        try {
            byte[] keyBytes = Base64.getDecoder().decode(encodedKey.trim());
            if (keyBytes == null || keyBytes.length == 0) {
                throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                        "Decoded private key bytes are empty");
            }
            
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM, BouncyCastleProvider.PROVIDER_NAME);
            return keyFactory.generatePrivate(keySpec);
        } catch (IllegalArgumentException e) {
            log.error("Invalid Base64 encoding for private key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Invalid Base64 encoding for private key", e);
        } catch (InvalidKeySpecException e) {
            log.error("Invalid key specification for private key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Invalid Ed25519 private key format. Expected PKCS8 encoded key.", e);
        } catch (NoSuchAlgorithmException e) {
            log.error("Ed25519 algorithm not available", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Ed25519 algorithm not available. Ensure BouncyCastle provider is properly configured.", e);
        } catch (Exception e) {
            log.error("Unexpected error during private key decoding", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Failed to decode private key from Base64", e);
        }
    }
    
    /**
     * Decode Base64 string to public key
     * 
     * @param encodedKey Base64 encoded public key
     * @return Decoded public key
     * @throws KeyStoreException if encodedKey is invalid or decoding fails
     */
    public PublicKey decodePublicKey(String encodedKey) {
        if (encodedKey == null || encodedKey.trim().isEmpty()) {
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Encoded public key cannot be null or empty");
        }
        
        try {
            byte[] keyBytes = Base64.getDecoder().decode(encodedKey.trim());
            if (keyBytes == null || keyBytes.length == 0) {
                throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                        "Decoded public key bytes are empty");
            }
            
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM, BouncyCastleProvider.PROVIDER_NAME);
            return keyFactory.generatePublic(keySpec);
        } catch (IllegalArgumentException e) {
            log.error("Invalid Base64 encoding for public key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Invalid Base64 encoding for public key", e);
        } catch (InvalidKeySpecException e) {
            log.error("Invalid key specification for public key", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Invalid Ed25519 public key format. Expected X509 encoded key.", e);
        } catch (NoSuchAlgorithmException e) {
            log.error("Ed25519 algorithm not available", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Ed25519 algorithm not available. Ensure BouncyCastle provider is properly configured.", e);
        } catch (Exception e) {
            log.error("Unexpected error during public key decoding", e);
            throw new KeyStoreException(TokenErrorCode.KEY_ENCODING_ERROR, 
                    "Failed to decode public key from Base64", e);
        }
    }
    
    /**
     * Generate a key pair and return both keys as Base64 strings
     * Useful for initial setup and key rotation
     * 
     * @return KeyPairStrings containing both encoded keys
     * @throws KeyStoreException if key generation or encoding fails
     */
    public KeyPairStrings generateKeyPairStrings() {
        KeyPair keyPair = generateKeyPair();
        return KeyPairStrings.builder()
                .privateKey(encodePrivateKey(keyPair.getPrivate()))
                .publicKey(encodePublicKey(keyPair.getPublic()))
                .build();
    }
    
    /**
     * Data class for key pair strings
     */
    @lombok.Data
    @lombok.Builder
    public static class KeyPairStrings {
        private String privateKey;
        private String publicKey;
    }
}
