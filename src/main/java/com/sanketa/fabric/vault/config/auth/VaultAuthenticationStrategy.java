package com.sanketa.fabric.vault.config.auth;

import org.springframework.vault.authentication.ClientAuthentication;
import org.springframework.web.client.RestOperations;

/**
 * Strategy interface for Vault authentication mechanisms.
 * 
 * @author mumei
 */
public interface VaultAuthenticationStrategy {
    
    /**
     * Creates a ClientAuthentication instance for Vault.
     * 
     * @param restOperations RestOperations instance for HTTP calls (may be null for token auth)
     * @return ClientAuthentication instance
     * @throws IllegalStateException if authentication configuration is invalid
     */
    ClientAuthentication createAuthentication(RestOperations restOperations);
    
    /**
     * Returns the authentication method name (e.g., "token", "approle").
     * 
     * @return authentication method name
     */
    String getMethodName();
}
