package com.sanketa.fabric.vault.config.auth;

import com.sanketa.fabric.vault.config.VaultProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.vault.authentication.ClientAuthentication;
import org.springframework.vault.authentication.TokenAuthentication;
import org.springframework.vault.support.VaultToken;
import org.springframework.web.client.RestOperations;

import java.util.Objects;

/**
 * Token-based authentication strategy for Vault.
 * 
 * @author mumei
 */
@Slf4j
@RequiredArgsConstructor
public class TokenAuthenticationStrategy implements VaultAuthenticationStrategy {
    
    private final VaultProperties.Auth auth;
    
    @Override
    public ClientAuthentication createAuthentication(RestOperations restOperations) {
        String token = null;
        
        if (Objects.nonNull(auth.getToken())) {
            token = auth.getToken().getToken();
        }
        if (Objects.isNull(token) || token.isEmpty()) {
            token = System.getenv("VAULT_TOKEN");
        }
        if (Objects.isNull(token) || token.isEmpty()) {
            throw new IllegalStateException(
                "Vault token not configured. Set fabric.vault.auth.token.token or VAULT_TOKEN environment variable");
        }
        
        log.debug("Using token-based authentication");
        return new TokenAuthentication(VaultToken.of(token));
    }
    
    @Override
    public String getMethodName() {
        return "token";
    }
}
