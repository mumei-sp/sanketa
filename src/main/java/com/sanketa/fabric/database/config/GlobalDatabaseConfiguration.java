package com.sanketa.fabric.database.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.Objects;

/**
 * Configuration for the Global Database connection.
 */
@Slf4j
@Configuration
@EnableConfigurationProperties(GlobalDatabaseProperties.class)
public class GlobalDatabaseConfiguration {

    private HikariDataSource globalDataSource;

    /**
     * Create the Global DB DataSource backed by HikariCP.
     */
    @Bean(name = "globalDataSource")
    public DataSource globalDataSource(GlobalDatabaseProperties properties) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(properties.getUrl());
        config.setUsername(properties.getUsername());
        config.setPassword(properties.getPassword());
        config.setDriverClassName(properties.getDriverClassName());

        GlobalDatabaseProperties.Pool pool = properties.getPool();
        config.setMaximumPoolSize(pool.getMaxSize());
        config.setMinimumIdle(pool.getMinIdle());
        config.setIdleTimeout(pool.getIdleTimeout().toMillis());
        config.setMaxLifetime(pool.getMaxLifetime().toMillis());
        config.setConnectionTimeout(pool.getConnectionTimeout().toMillis());

        // Pool name for monitoring/observability
        config.setPoolName("GlobalDbPool");

        log.info("Initializing Global DB HikariDataSource with url={}", maskUrl(properties.getUrl()));
        this.globalDataSource = new HikariDataSource(config);
        return this.globalDataSource;
    }

    /**
     * JdbcTemplate for convenient access to the Global DB.
     */
    @Bean(name = "globalJdbcTemplate")
    public JdbcTemplate globalJdbcTemplate(DataSource globalDataSource) {
        Objects.requireNonNull(globalDataSource, "globalDataSource must not be null");
        return new JdbcTemplate(globalDataSource);
    }

    @PreDestroy
    public void shutdown() {
        if (globalDataSource != null) {
            log.info("Shutting down Global DB HikariDataSource");
            globalDataSource.close();
        }
    }

    /**
     * Avoid logging credentials if they are embedded in the JDBC URL.
     */
    private String maskUrl(String url) {
        int qIndex = url.indexOf('?');
        return qIndex > 0 ? url.substring(0, qIndex) : url;
    }
}

