package com.sanketa.fabric.vault.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.vault.authentication.AppRoleAuthentication;
import org.springframework.vault.authentication.AppRoleAuthenticationOptions;
import org.springframework.vault.authentication.ClientAuthentication;
import org.springframework.vault.authentication.TokenAuthentication;
import org.springframework.vault.client.RestTemplateFactory;
import org.springframework.vault.client.VaultEndpoint;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.ClientOptions;
import org.springframework.vault.support.SslConfiguration;
import org.springframework.vault.support.VaultToken;
import org.springframework.web.client.RestOperations;

import java.net.URI;

/**
 * Vault configuration using Spring Vault's VaultTemplate.
 * 
 * Provides:
 * - Token and AppRole authentication
 * - Configurable connection timeouts
 * - TLS/SSL support
 * 
 * Spring Vault automatically handles:
 * - Retry mechanism
 * - Connection pooling
 * - Health checks (via Actuator)
 * - Token renewal
 */
@Configuration
@EnableConfigurationProperties(VaultProperties.class)
@ConditionalOnProperty(name = "fabric.vault.enabled", havingValue = "true")
public class VaultConfiguration {
    
    private final VaultProperties properties;
    
    public VaultConfiguration(VaultProperties properties) {
        this.properties = properties;
    }
    
    @Bean
    public VaultTemplate vaultTemplate() {
        VaultEndpoint endpoint = VaultEndpoint.from(URI.create(properties.getAddress()));
        
        if (properties.getNamespace() != null && !properties.getNamespace().isEmpty()) {
            endpoint.setNamespace(properties.getNamespace());
        }
        
        ClientOptions clientOptions = getClientOptions();
        SslConfiguration sslConfiguration = getSslConfiguration();
        RestOperations restOperations = RestTemplateFactory.create(clientOptions, sslConfiguration);    
        ClientAuthentication authentication = createAuthentication(restOperations);
        return new VaultTemplate(endpoint, restOperations, authentication);
    }
    
    private ClientAuthentication createAuthentication(RestOperations restOperations) {
        String method = properties.getAuth().getMethod().toLowerCase();
        
        switch (method) {
            case "token":
                return createTokenAuthentication();
            case "approle":
                return createAppRoleAuthentication(restOperations);
            default:
                throw new IllegalArgumentException(
                    "Unsupported authentication method: " + method + ". Supported methods: token, approle");
        }
    }
    
    private ClientAuthentication createTokenAuthentication() {
        String token = properties.getAuth().getToken().getToken();
        if (token == null || token.isEmpty()) {
            token = System.getenv("VAULT_TOKEN");
        }
        if (token == null || token.isEmpty()) {
            throw new IllegalStateException(
                "Vault token not configured. Set fabric.vault.auth.token.token or VAULT_TOKEN environment variable");
        }
        return new TokenAuthentication(VaultToken.of(token));
    }
    
    private ClientAuthentication createAppRoleAuthentication(RestOperations restOperations) {
        String roleId = properties.getAuth().getApprole().getRoleId();
        String secretId = properties.getAuth().getApprole().getSecretId();
        String mountPath = properties.getAuth().getApprole().getMountPath();
        
        if (roleId == null || roleId.isEmpty()) {
            roleId = System.getenv("VAULT_ROLE_ID");
        }
        if (secretId == null || secretId.isEmpty()) {
            secretId = System.getenv("VAULT_SECRET_ID");
        }
        
        if (roleId == null || roleId.isEmpty() || secretId == null || secretId.isEmpty()) {
            throw new IllegalStateException(
                "AppRole credentials not configured. Set fabric.vault.auth.approle.role-id/secret-id " +
                "or VAULT_ROLE_ID/VAULT_SECRET_ID environment variables");
        }
        
        AppRoleAuthenticationOptions options = AppRoleAuthenticationOptions.builder()
            .roleId(AppRoleAuthenticationOptions.RoleId.provided(roleId))
            .secretId(AppRoleAuthenticationOptions.SecretId.provided(secretId))
            .appRoleMountPath(mountPath)
            .build();
        return new AppRoleAuthentication(options, restOperations);
    }
    
    private ClientOptions getClientOptions() {
        return new ClientOptions(
            properties.getConnection().getTimeout(),
            properties.getConnection().getReadTimeout()
        );
    }
    
    private SslConfiguration getSslConfiguration() {
        // For basic TLS verification (most common use case)
        // For custom certificates, extend this configuration
        return SslConfiguration.create(
            properties.getTls().isVerify() 
                ? SslConfiguration.KeyStoreConfiguration.unconfigured()
                : SslConfiguration.KeyStoreConfiguration.unconfigured()
        );
    }
}

