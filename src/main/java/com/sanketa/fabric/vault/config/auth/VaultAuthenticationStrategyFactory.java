package com.sanketa.fabric.vault.config.auth;

import com.sanketa.fabric.vault.config.VaultProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Factory for creating Vault authentication strategies.
 * 
 * @author mumei
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VaultAuthenticationStrategyFactory {
    
    private final VaultProperties properties;
    
    /**
     * Creates the appropriate authentication strategy based on configuration.
     */
    public VaultAuthenticationStrategy createStrategy() {
        VaultProperties.Auth auth = properties.getAuth();
        if (Objects.isNull(auth)) {
            throw new IllegalStateException("Vault authentication configuration is required");
        }
        
        String method = auth.getMethod();
        if (Objects.isNull(method) || method.isEmpty()) {
            throw new IllegalStateException("Vault authentication method is required");
        }
        
        String methodLower = method.toLowerCase();
        
        return switch (methodLower) {
            case "token" -> new TokenAuthenticationStrategy(auth);
            case "approle" -> new AppRoleAuthenticationStrategy(auth);
            default -> throw new IllegalArgumentException(
                    "Unsupported authentication method: " + method + ". Supported methods: token, approle");
        };
    }
}
