package com.sanketa.fabric.vault.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.socket.ConnectionSocketFactory;
import org.apache.hc.client5.http.socket.PlainConnectionSocketFactory;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.http.config.Registry;
import org.apache.hc.core5.http.config.RegistryBuilder;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

import javax.net.ssl.SSLContext;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyStore;
import java.util.Objects;

/**
 * Helper class for configuring TLS/SSL settings for Vault HTTP client.
 * 
 * @author mumei
 */
@Slf4j
public class TlsConfigurationHelper {
    
    /**
     * Creates an HttpComponentsClientHttpRequestFactory with TLS configuration.
     * 
     * @param tls TLS configuration properties
     * @param connectionTimeout Connection timeout
     * @param readTimeout Read timeout
     * @return Configured HttpComponentsClientHttpRequestFactory
     */
    public static HttpComponentsClientHttpRequestFactory createRequestFactory(
            VaultProperties.Tls tls, 
            java.time.Duration connectionTimeout,
            java.time.Duration readTimeout) {
        
        try {
            SSLContext sslContext = createSSLContext(tls);
            
            // Create socket factory with hostname verification based on configuration
            SSLConnectionSocketFactory sslSocketFactory;
            if (!tls.isVerify()) {
                log.warn("TLS verification is disabled. This should only be used in development with self-signed certificates.");
                sslSocketFactory = new SSLConnectionSocketFactory(
                    sslContext,
                    NoopHostnameVerifier.INSTANCE);
            } else {
                sslSocketFactory = new SSLConnectionSocketFactory(sslContext);
            }
            
            // Register both HTTP and HTTPS socket factories
            Registry<ConnectionSocketFactory> socketFactoryRegistry = RegistryBuilder
                .<ConnectionSocketFactory>create()
                .register("http", PlainConnectionSocketFactory.getSocketFactory())
                .register("https", sslSocketFactory)
                .build();
            
            // Create connection manager with socket factory registry
            PoolingHttpClientConnectionManager connectionManager = 
                new PoolingHttpClientConnectionManager(socketFactoryRegistry);
            connectionManager.setMaxTotal(100);
            connectionManager.setDefaultMaxPerRoute(20);
            
            // Create HTTP client
            CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .evictIdleConnections(TimeValue.of(java.time.Duration.ofSeconds(30)))
                .evictExpiredConnections()
                .build();
            
            // Create request factory with timeouts
            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
            factory.setConnectTimeout(connectionTimeout);
            factory.setConnectionRequestTimeout(connectionTimeout);
            factory.setReadTimeout(readTimeout);
            
            return factory;
            
        } catch (Exception e) {
            log.error("Failed to create TLS-configured request factory, falling back to default", e);
            // Fallback to default factory if TLS configuration fails
            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
            factory.setConnectTimeout(connectionTimeout);
            factory.setConnectionRequestTimeout(connectionTimeout);
            factory.setReadTimeout(readTimeout);
            return factory;
        }
    }
    
    /**
     * Creates SSLContext based on TLS configuration.
     */
    private static SSLContext createSSLContext(VaultProperties.Tls tls) throws Exception {
        SSLContextBuilder sslContextBuilder = SSLContextBuilder.create();
        
        // Configure trust store if provided
        if (Objects.nonNull(tls.getTrustStorePath()) && !tls.getTrustStorePath().isEmpty()) {
            log.debug("Loading trust store from: {}", tls.getTrustStorePath());
            KeyStore trustStore = loadKeyStore(
                tls.getTrustStorePath(),
                tls.getTrustStorePassword(),
                tls.getTrustStoreType());
            sslContextBuilder.loadTrustMaterial(trustStore, null);
        }
        
        // Configure key store (for client certificate authentication) if provided
        if (Objects.nonNull(tls.getKeyStorePath()) && !tls.getKeyStorePath().isEmpty()) {
            log.debug("Loading key store from: {}", tls.getKeyStorePath());
            KeyStore keyStore = loadKeyStore(
                tls.getKeyStorePath(),
                tls.getKeyStorePassword(),
                tls.getKeyStoreType());
            sslContextBuilder.loadKeyMaterial(keyStore, 
                tls.getKeyStorePassword() != null ? tls.getKeyStorePassword().toCharArray() : null);
        }
        
        return sslContextBuilder.build();
    }
    
    /**
     * Loads a KeyStore from file.
     */
    private static KeyStore loadKeyStore(String path, String password, String type) throws Exception {
        String keystoreType = (type != null && !type.isEmpty()) ? type : "JKS";
        KeyStore keyStore = KeyStore.getInstance(keystoreType);
        
        char[] passwordChars = (password != null && !password.isEmpty()) 
            ? password.toCharArray() 
            : null;
        
        try (InputStream inputStream = new FileInputStream(path)) {
            keyStore.load(inputStream, passwordChars);
        }
        
        return keyStore;
    }
}
