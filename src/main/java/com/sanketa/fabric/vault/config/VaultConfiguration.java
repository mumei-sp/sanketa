package com.sanketa.fabric.vault.config;

import com.sanketa.fabric.vault.config.auth.VaultAuthenticationStrategy;
import com.sanketa.fabric.vault.config.auth.VaultAuthenticationStrategyFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.vault.client.VaultEndpoint;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.web.client.RestOperations;

import java.net.URI;
import java.time.Duration;
import java.util.Objects;

/**
 * Vault configuration using Spring Vault's VaultTemplate.
 * 
 * @author mumei
 */
@Slf4j
@Configuration
@EnableConfigurationProperties(VaultProperties.class)
@ConditionalOnProperty(name = "fabric.vault.enabled", havingValue = "true")
public class VaultConfiguration {
    
    private final VaultProperties properties;
    private final VaultAuthenticationStrategyFactory authenticationStrategyFactory;
    
    /**
     * Validates configuration at construction time.
     */
    public VaultConfiguration(VaultProperties properties, VaultAuthenticationStrategyFactory authenticationStrategyFactory) {
        this.properties = Objects.requireNonNull(properties, "VaultProperties cannot be null");
        this.authenticationStrategyFactory = Objects.requireNonNull(
            authenticationStrategyFactory, "VaultAuthenticationStrategyFactory cannot be null");
        validateConfiguration();
    }
    
    /**
     * Creates and configures the VaultTemplate bean.
     */
    @Bean
    public VaultTemplate vaultTemplate(RestTemplateBuilder restTemplateBuilder) {
        VaultEndpoint endpoint = createVaultEndpoint();
        VaultAuthenticationStrategy strategy = authenticationStrategyFactory.createStrategy();
        
        // Create RestOperations with TLS support
        RestOperations restOperations = createRestOperations(restTemplateBuilder, strategy);
        
        // Create authentication using the strategy
        var authentication = strategy.createAuthentication(restOperations);
        
        log.info("VaultTemplate configured with {} authentication", strategy.getMethodName());
        return new VaultTemplate(endpoint, authentication);
    }
    
    /**
     * Creates and configures the VaultEndpoint.
     */
    private VaultEndpoint createVaultEndpoint() {
        String address = properties.getAddress();
        if (Objects.isNull(address) || address.isEmpty()) {
            throw new IllegalStateException("Vault address is required when vault is enabled");
        }
        
        try {
            URI uri = URI.create(address);
            return VaultEndpoint.from(uri);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid Vault address format: " + address + ". Expected format: http(s)://host:port", e);
        }
    }
    
    /**
     * Creates RestOperations with configured timeouts and TLS settings.
     */
    private RestOperations createRestOperations(RestTemplateBuilder restTemplateBuilder, VaultAuthenticationStrategy strategy) {

        // Token authentication doesn't require RestOperations
        if ("token".equals(strategy.getMethodName())) {
            return null;
        }
        
        VaultProperties.Connection connection = properties.getConnection();
        Duration connectionTimeout = connection != null && connection.getTimeout() != null
            ? connection.getTimeout()
            : Duration.ofSeconds(10);
        Duration readTimeout = connection != null && connection.getReadTimeout() != null
            ? connection.getReadTimeout()
            : Duration.ofSeconds(30);
        
        // Use TLS configuration if TLS is configured
        VaultProperties.Tls tls = properties.getTls();
        HttpComponentsClientHttpRequestFactory requestFactory;
        
        if (tls != null && (hasTlsConfiguration(tls) || !tls.isVerify())) {
            // Use TLS configuration with HttpComponents
            requestFactory = TlsConfigurationHelper.createRequestFactory(tls, connectionTimeout, readTimeout);
            log.debug("Using TLS configuration for Vault client");
        } else {
            // Use default factory with timeouts
            requestFactory = new HttpComponentsClientHttpRequestFactory();
            requestFactory.setConnectTimeout(connectionTimeout);
            requestFactory.setConnectionRequestTimeout(connectionTimeout);
            requestFactory.setReadTimeout(readTimeout);
            log.debug("Using default TLS configuration for Vault client");
        }
        
        return restTemplateBuilder
            .requestFactory(() -> requestFactory)
            .build();
    }
    
    /**
     * Checks if TLS configuration has custom trust/key stores configured.
     */
    private boolean hasTlsConfiguration(VaultProperties.Tls tls) {
        return (tls.getTrustStorePath() != null && !tls.getTrustStorePath().isEmpty()) ||
               (tls.getKeyStorePath() != null && !tls.getKeyStorePath().isEmpty());
    }
    
    /**
     * Validates the configuration at construction time.
     */
    private void validateConfiguration() {
        if (Objects.isNull(properties.getAddress()) || properties.getAddress().isEmpty()) {
            throw new IllegalStateException(
                "Vault address is required when vault is enabled. Set fabric.vault.address");
        }
        
        if (Objects.isNull(properties.getAuth())) {
            throw new IllegalStateException(
                "Vault authentication configuration is required. Set fabric.vault.auth");
        }
    }
}
