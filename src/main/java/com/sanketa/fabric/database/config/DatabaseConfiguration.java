package com.sanketa.fabric.database.config;

import com.sanketa.fabric.database.jpa.TenantEntityManagerFactory;
import com.sanketa.fabric.database.jpa.TenantSchemaResolver;
import com.sanketa.fabric.database.pool.TenantConnectionPoolManager;
import com.sanketa.fabric.database.routing.TenantRoutingDataSource;
import com.sanketa.fabric.database.transaction.TenantTransactionManager;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManagerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Objects;

/**
 * Database configuration for multi-tenant database routing.
 * 
 * @author mumei
 */
@Slf4j
@Configuration
@EnableConfigurationProperties({DatabaseProperties.class, TenantWarmupProperties.class})
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.sanketa.fabric",
    entityManagerFactoryRef = "tenantEntityManagerFactory",
    transactionManagerRef = "tenantTransactionManager"
)
@ConditionalOnProperty(prefix = "fabric.database", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DatabaseConfiguration {
    
    private final DatabaseProperties properties;
    private final TenantConnectionPoolManager poolManager;
    private final TenantSchemaResolver schemaResolver;
    
    public DatabaseConfiguration(DatabaseProperties properties, TenantConnectionPoolManager poolManager,
            TenantSchemaResolver schemaResolver) {
        this.properties = properties;
        this.poolManager = poolManager;
        this.schemaResolver = schemaResolver;
    }
    
    /**
     * Create the primary routing DataSource.
     * 
     * This DataSource routes to the appropriate tenant database
     * based on the RequestContext stored in ThreadLocal.
     */
    @Bean
    @Primary
    public DataSource tenantRoutingDataSource() {
        log.info("Configuring TenantRoutingDataSource");
        return new TenantRoutingDataSource(poolManager);
    }
    
    /**
     * Create the EntityManagerFactory for tenant-aware JPA.
     */
    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean tenantEntityManagerFactory(DataSource tenantRoutingDataSource) {
        if (Objects.isNull(tenantRoutingDataSource)) {
            throw new IllegalStateException("tenantRoutingDataSource bean cannot be null");
        }
        
        log.info("Configuring tenant-aware EntityManagerFactory with entity packages: {}", 
            String.join(", ", properties.getJpa().getEntityPackages()));

        TenantEntityManagerFactory factoryHelper = new TenantEntityManagerFactory(
            properties, schemaResolver);
        LocalContainerEntityManagerFactoryBean factory = factoryHelper
            .createEntityManagerFactory(
                tenantRoutingDataSource,
                properties.getJpa().getEntityPackages()
            );
        
        return factory;
    }
    
    /**
     * Create the TransactionManager for tenant-aware transactions.
     */
    @Bean
    @Primary
    @DependsOn("tenantEntityManagerFactory")
    public PlatformTransactionManager tenantTransactionManager(LocalContainerEntityManagerFactoryBean tenantEntityManagerFactory) {
        log.info("Configuring tenant-aware TransactionManager");
        
        // Access the Object after the factory is fully initialized.
        // LocalContainerEntityManagerFactoryBean implements InitializingBean,
        // and Spring will call afterPropertiesSet() before this bean is created
        // due to @DependsOn annotation. However, we still validate to be defensive.
        EntityManagerFactory emf = tenantEntityManagerFactory.getObject();
        if (Objects.isNull(emf)) {
            throw new IllegalStateException(
                "EntityManagerFactory is null. The tenantEntityManagerFactory bean may not have been " +
                "fully initialized. This could indicate a configuration or initialization order issue."
            );
        }
        return new TenantTransactionManager(emf);
    }
    
    /**
     * Cleanup on shutdown.
     */
    @PreDestroy
    public void shutdown() {
        log.info("Shutting down database configuration");
        poolManager.shutdown();
    }
}
