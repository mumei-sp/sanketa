package com.sanketa.fabric.database.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;

/**
 * Database configuration properties for multi-tenant database routing.
 * 
 * @author mumei
 */
@Data
@Validated
@ConfigurationProperties(prefix = "fabric.database")
public class DatabaseProperties {
    
    /**
     * Enable tenant database routing
     */
    private boolean enabled = true;
    
    /**
     * Connection pool configuration
     */
    @NotNull
    private Pool pool = new Pool();
    
    /**
     * Timeout configuration
     */
    @NotNull
    private Timeout timeout = new Timeout();
    
    /**
     * Health check configuration
     */
    @NotNull
    private Health health = new Health();
    
    /**
     * Schema switching configuration
     */
    @NotNull
    private Schema schema = new Schema();
    
    /**
     * JPA entity package scanning configuration
     */
    @NotNull
    private Jpa jpa = new Jpa();
    
    /**
     * Connection pool configuration
     */
    @Data
    public static class Pool {
        /**
         * Maximum pool size per database instance
         */
        @Min(1)
        private int maxSize = 20;
        
        /**
         * Minimum idle connections per pool
         */
        @Min(0)
        private int minIdle = 5;
        
        /**
         * Maximum idle connections per pool
         */
        @Min(1)
        private int maxIdle = 10;
        
        /**
         * Connection timeout (time to wait for a connection from pool)
         */
        @NotNull
        private Duration connectionTimeout = Duration.ofSeconds(30);
        
        /**
         * Idle timeout (time before idle connections are removed)
         */
        @NotNull
        private Duration idleTimeout = Duration.ofMinutes(10);
        
        /**
         * Maximum lifetime of a connection in the pool
         */
        @NotNull
        private Duration maxLifetime = Duration.ofMinutes(30);

        /**
         * Time between eviction runs for idle connections.
         * <p>
         * In the HikariCP-based implementation, this value is used as the base
         * period for keepalive / eviction checks and is validated against
         * {@link #idleTimeout} and {@link #maxLifetime} to comply with:
         * keepaliveTime &lt; idleTimeout &lt; maxLifetime.
         */
        @NotNull
        private Duration timeBetweenEvictionRuns = Duration.ofSeconds(30);
        
        /**
         * Connection validation query (database-specific).
         *
         * Set this explicitly (e.g. {@code SELECT 1}) only when you need a custom
         * validation query, typically for legacy drivers that do not implement
         * {@code Connection.isValid()} correctly.
         */
        private String validationQuery = "";
    }
    
    /**
     * Timeout configuration
     */
    @Data
    public static class Timeout {
        /**
         * Connection timeout (time to establish connection)
         */
        @NotNull
        private Duration connect = Duration.ofSeconds(10);
        
        /**
         * Socket timeout (time to wait for data)
         */
        @NotNull
        private Duration socket = Duration.ofSeconds(30);
        
        /**
         * Query timeout (time to wait for query execution)
         */
        @NotNull
        private Duration query = Duration.ofSeconds(60);
    }
    
    /**
     * Health check configuration
     */
    @Data
    public static class Health {
        /**
         * Enable health checks
         */
        private boolean enabled = true;
        
        /**
         * Health check interval
         */
        @NotNull
        private Duration interval = Duration.ofSeconds(30);
        
        /**
         * Health check timeout
         */
        @NotNull
        private Duration timeout = Duration.ofSeconds(5);
        
        /**
         * Number of consecutive failures before marking as unhealthy
         */
        @Min(1)
        private int failureThreshold = 3;
    }
    
    /**
     * Schema switching configuration
     */
    @Data
    public static class Schema {
        /**
         * Enable schema switching (for schema-based multi-tenancy)
         */
        private boolean enabled = true;
        
        /**
         * Validate schema exists before switching.
         * When true, validates schema name is not null/blank.
         * Set validateSchemaInDatabase to true for database-level validation.
         */
        private boolean validateSchema = true;
        
        /**
         * Validate schema exists in database by querying database catalog.
         * This is an optional expensive check that queries the database to verify
         * the schema actually exists. Results are cached to minimize overhead.
         * 
         * Default: false (only validates schema name, not database existence)
         */
        private boolean validateSchemaInDatabase = false;
        
        /**
         * Schema switching method: "hibernate" (via hibernate.default_schema) or "sql" (via SET SCHEMA)
         */
        @NotNull
        private String method = "hibernate";
    }
    
    /**
     * JPA configuration
     */
    @Data
    public static class Jpa {
        /**
         * Base packages to scan for JPA entities.
         * Defaults to "com.sanketa.fabric" if not specified.
         */
        private String[] entityPackages = {"com.sanketa.fabric"};
    }
}
