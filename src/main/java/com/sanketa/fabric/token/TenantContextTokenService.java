package com.sanketa.fabric.token;

import com.sanketa.fabric.token.exception.TokenErrorCode;
import com.sanketa.fabric.token.exception.TokenValidationException;
import com.sanketa.fabric.token.key.KeyStore;
import com.sanketa.fabric.token.key.KeyStoreException;
import com.sanketa.fabric.token.model.TenantContext;
import dev.paseto.jpaseto.Claims;
import dev.paseto.jpaseto.Paseto;
import dev.paseto.jpaseto.PasetoParser;
import dev.paseto.jpaseto.Pasetos;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.List;

/**
 * Tenant Context Token Service
 * 
 * Handles creation, signing, and validation of PASETO v2.public tokens.
 * - Stateless token generation and validation
 * - Ed25519 signing with key rotation support (kid)
 * - No database lookups
 * 
 * @author mumei
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantContextTokenService {
    
    private final KeyStore keyStore;
    private final TenantContextTokenProperties properties;
    
    /**
     * Generate and sign a Tenant Context Token
     * 
     * @param userId User ID from Global DB
     * @param tenantIds List of tenant IDs the user belongs to
     * @param keyId Key ID for signing (null uses default)
     * @return Signed PASETO token string
     * @throws TokenValidationException if key retrieval or token generation fails
     */
    public String generateToken(Long userId, List<Long> tenantIds, String keyId) {
        try {
            Instant now = Instant.now();
            Instant expiration = now.plusSeconds(properties.getTokenTtlSeconds());

            // Determine effective key ID (use provided keyId or default)
            String effectiveKeyId = (keyId != null && !keyId.isEmpty()) ? keyId : keyStore.getDefaultKeyId();
            PrivateKey signingKey = keyStore.getSigningKey(effectiveKeyId);

            String token = Pasetos.V2.PUBLIC.builder()
                    .setPrivateKey(signingKey)
                    .setSubject(String.valueOf(userId))
                    .setIssuedAt(now)
                    .setExpiration(expiration)
                    .claim("uid", userId)
                    .claim("tenantIds", tenantIds != null ? tenantIds : List.of())
                    .claim("kid", effectiveKeyId)
                    .compact();
            log.debug("Generated TCT for userId: {}, tenantIds: {}, expiresAt: {}", 
                    userId, tenantIds, expiration);
            
            return token;
        } catch (KeyStoreException e) {
            log.error("Failed to retrieve signing key for token generation", e);
            throw new TokenValidationException(TokenErrorCode.TOKEN_GENERATION_FAILED, 
                    "Failed to retrieve signing key: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during token generation", e);
            throw new TokenValidationException(TokenErrorCode.TOKEN_GENERATION_FAILED, 
                    "Failed to generate token", e);
        }
    }
    
    /**
     * Generate token with default key ID
     */
    public String generateToken(Long userId, List<Long> tenantIds) {
        return generateToken(userId, tenantIds, null);
    }
    
    /**
     * Validate and parse a Tenant Context Token
     * 
     * @param token PASETO token string
     * @return TenantContext with validated claims
     * @throws TokenValidationException if token is invalid
     */
    public TenantContext validateAndParseToken(String token) {
        try {
            if (isTokenExpired(token)) {
                throw new TokenValidationException(TokenErrorCode.TOKEN_EXPIRED, 
                        "Token has expired");
            }
            
            String defaultKeyId = keyStore.getDefaultKeyId();
            PublicKey defaultKey = keyStore.getVerificationKey(defaultKeyId);
            
            PasetoParser parser = Pasetos.parserBuilder()
                    .setPublicKey(defaultKey)
                    .build();
            Paseto paseto;
            String keyId = defaultKeyId;
            
            try {
                // Try with default key
                paseto = parser.parse(token);
            } catch (dev.paseto.jpaseto.PasetoException e) {
                // If default key fails, token might be signed with a different key (key rotation scenario)
                // Note: We cannot extract kid from unverified PASETO tokens for security reasons
                
                // For now, we'll just fail with the original exception
                // TODO: implement key rotation strategy here
                log.debug("Token validation failed with default key, may need key rotation handling");
                throw e;
            }
            
            Claims claims = paseto.getClaims();
            Long userId = claims.get("uid", Long.class);
            @SuppressWarnings("unchecked")
            List<Long> tenantIds = claims.get("tenantIds", List.class);
            Instant issuedAt = claims.getIssuedAt();
            Instant expiresAt = claims.getExpiration();
            
            if (userId == null) {
                throw new TokenValidationException(TokenErrorCode.USER_ID_INVALID, 
                        "Missing userId in token");
            }
            if (tenantIds == null) {
                tenantIds = List.of();
            }

            TenantContext context = TenantContext.builder()
                    .userId(userId)
                    .tenantIds(tenantIds)
                    .keyId(keyId)
                    .issuedAt(issuedAt != null ? issuedAt.getEpochSecond() : null)
                    .expiresAt(expiresAt != null ? expiresAt.getEpochSecond() : null)
                    .build();
            log.debug("Validated TCT for userId: {}, tenantIds: {}", userId, tenantIds);
            return context;
        } catch (KeyStoreException e) {
            log.error("Failed to retrieve verification key for token validation", e);
            throw new TokenValidationException(TokenErrorCode.TOKEN_KEY_NOT_FOUND, 
                    "Verification key not available: " + e.getMessage(), e);
        } catch (dev.paseto.jpaseto.PasetoException e) {
            log.warn("Token validation failed: {}", e.getMessage());
            TokenErrorCode errorCode = determineErrorCode(e);
            throw new TokenValidationException(errorCode, "Invalid token: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during token validation", e);
            throw new TokenValidationException(TokenErrorCode.TOKEN_PARSE_ERROR, 
                    "Token validation error", e);
        }
    }
    
    /**
     * Check if token is expired (without full validation)
     * Useful for quick expiration checks
     */
    public boolean isTokenExpired(String token) {
        try {
            PasetoParser parser = Pasetos.parserBuilder()
                    .build();
            
            Paseto paseto = parser.parse(token);
            Claims claims = paseto.getClaims();
            Instant expiration = claims.getExpiration();
            if (expiration == null) {
                return true;
            }
            return Instant.now().isAfter(expiration);
        } catch (Exception e) {
            log.debug("Could not check token expiration: {}", e.getMessage());
            return true;
        }
    }
    
    /**
     * Determines the appropriate error code based on the PASETO exception.
     * 
     * @param e the PASETO exception
     * @return the appropriate TokenErrorCode
     */
    private TokenErrorCode determineErrorCode(dev.paseto.jpaseto.PasetoException e) {
        String message = e.getMessage();
        if (message != null) {
            String lowerMessage = message.toLowerCase();
            if (lowerMessage.contains("expired")) {
                return TokenErrorCode.TOKEN_EXPIRED;
            } else if (lowerMessage.contains("signature") || lowerMessage.contains("verification")) {
                return TokenErrorCode.TOKEN_INVALID_SIGNATURE;
            } else if (lowerMessage.contains("parse") || lowerMessage.contains("format")) {
                return TokenErrorCode.TOKEN_PARSE_ERROR;
            }
        }
        return TokenErrorCode.TOKEN_INVALID_FORMAT;
    }
}
