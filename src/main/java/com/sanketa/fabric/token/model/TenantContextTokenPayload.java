package com.sanketa.fabric.token.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Tenant Context Token (TCT) Payload
 * 
 * This is the payload structure for the PASETO v4.public token.
 * Contains minimal information needed for tenant resolution and DB routing.
 * 
 * Fields:
 * - iat: Issued at timestamp (Unix epoch seconds)
 * - exp: Expiration timestamp (Unix epoch seconds)
 * - uid: User ID from Global DB
 * - tenantIds: List of tenant IDs the user belongs to
 * - kid: Key ID for key rotation support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContextTokenPayload {
    
    /**
     * Issued at - Unix timestamp in seconds
     */
    @JsonProperty("iat")
    private Long issuedAt;
    
    /**
     * Expiration - Unix timestamp in seconds
     */
    @JsonProperty("exp")
    private Long expiresAt;
    
    /**
     * User ID from Global DB (not Keycloak ID)
     */
    @JsonProperty("uid")
    private Long userId;
    
    /**
     * List of tenant IDs (schools) the user belongs to
     * Empty list means user has no tenant access
     */
    @JsonProperty("tenantIds")
    private List<Long> tenantIds;
    
    /**
     * Key ID - Identifies which signing key was used
     * Enables key rotation without invalidating all tokens
     */
    @JsonProperty("kid")
    private String keyId;
    
    /**
     * Helper method to check if token is expired
     */
    public boolean isExpired() {
        if (expiresAt == null) {
            return true;
        }
        return Instant.now().getEpochSecond() > expiresAt;
    }
    
    /**
     * Helper method to check if token is valid (not expired)
     */
    public boolean isValid() {
        return !isExpired() && userId != null && tenantIds != null;
    }

}
