package com.sanketa.fabric.database.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Configuration properties for the Global Database.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "fabric.global-database")
public class GlobalDatabaseProperties {

    /**
     * JDBC URL for the Global DB.
     */
    @NotBlank
    private String url;

    /**
     * Username for the Global DB connection.
     */
    @NotBlank
    private String username;

    /**
     * Password for the Global DB connection.
     */
    @NotBlank
    private String password;

    /**
     * JDBC driver class name.
     */
    @NotBlank
    private String driverClassName;

    /**
     * Connection pool configuration for the Global DB.
     */
    @NotNull
    private Pool pool = new Pool();

    @Data
    public static class Pool {

        /**
         * Maximum number of connections in the pool.
         */
        private int maxSize = 10;

        /**
         * Minimum number of idle connections in the pool.
         */
        private int minIdle = 2;

        /**
         * Maximum time to wait for a connection from the pool.
         */
        @NotNull
        private Duration connectionTimeout = Duration.ofSeconds(10);

        /**
         * Idle timeout for connections in the pool.
         */
        @NotNull
        private Duration idleTimeout = Duration.ofMinutes(5);

        /**
         * Maximum lifetime of a connection in the pool.
         */
        @NotNull
        private Duration maxLifetime = Duration.ofMinutes(30);
    }
}
