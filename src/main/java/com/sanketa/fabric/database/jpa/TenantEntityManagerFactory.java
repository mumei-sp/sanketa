package com.sanketa.fabric.database.jpa;

import com.sanketa.fabric.database.config.DatabaseProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

import javax.sql.DataSource;
import java.util.Map;
import java.util.Properties;

/**
 * Factory for creating tenant-aware EntityManagerFactory.
 * 
 * This class provides a centralized way to create and configure
 * the EntityManagerFactory with tenant-aware settings including
 * schema switching and multi-tenancy support.
 * 
 * @author mumei
 */
@Slf4j
public class TenantEntityManagerFactory {
    
    private final DatabaseProperties properties;
    private final TenantSchemaResolver schemaResolver;
    
    public TenantEntityManagerFactory(DatabaseProperties properties, TenantSchemaResolver schemaResolver) {
        this.properties = properties;
        this.schemaResolver = schemaResolver;
    }
    
    /**
     * Create a tenant-aware EntityManagerFactory.
     * 
     * @param dataSource The routing DataSource
     * @param packagesToScan Packages to scan for entities
     * @return Configured EntityManagerFactory
     */
    public LocalContainerEntityManagerFactoryBean createEntityManagerFactory(
            DataSource dataSource,
            String... packagesToScan) {
        log.info("Creating tenant-aware EntityManagerFactory");
        
        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan(packagesToScan);
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Properties jpaProperties = createJpaProperties();
        factory.setJpaProperties(jpaProperties);
        
        return factory;
    }
    
    /**
     * Create JPA properties with tenant-aware configuration.
     */
    private Properties createJpaProperties() {
        Properties jpaProperties = new Properties();
        
        // Basic Hibernate settings
        String dialect = resolveHibernateDialect();
        jpaProperties.put("hibernate.dialect", dialect);
        jpaProperties.put("hibernate.hbm2ddl.auto", "none"); // Don't auto-create schemas
        jpaProperties.put("hibernate.show_sql", "false");
        jpaProperties.put("hibernate.format_sql", "true");
        jpaProperties.put("hibernate.use_sql_comments", "true");
        
        // Schema switching configuration
        if (properties.getSchema().isEnabled()) {
            Map<String, Object> schemaProperties = schemaResolver.getHibernateProperties();
            jpaProperties.putAll(schemaProperties);
        }
        
        // Connection pool settings
        jpaProperties.put("hibernate.connection.provider_disables_autocommit", "true");
        jpaProperties.put("hibernate.connection.autocommit", "false");
        
        // Performance optimizations
        jpaProperties.put("hibernate.jdbc.batch_size", "20");
        jpaProperties.put("hibernate.order_inserts", "true");
        jpaProperties.put("hibernate.order_updates", "true");
        jpaProperties.put("hibernate.jdbc.batch_versioned_data", "true");
        
        return jpaProperties;
    }

    /**
     * Hibernate dialect based on the current tenant's database type.
     */
    private String resolveHibernateDialect() {
        String dbType = schemaResolver.getDatabaseType();
        
        String dialect = switch (dbType) {
            case "POSTGRESQL" -> "org.hibernate.dialect.PostgreSQLDialect";
            case "MSSQL", "SQLSERVER" -> "org.hibernate.dialect.SQLServerDialect";
            case "MARIADB" -> "org.hibernate.dialect.MariaDBDialect";
            case "MYSQL":
            default -> "org.hibernate.dialect.MySQLDialect";
        };
        
        log.info("Resolved Hibernate dialect '{}' for database type '{}'", dialect, dbType);
        return dialect;
    }
}
