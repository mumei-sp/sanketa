package com.sanketa.fabric.database.config;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Configuration properties for tenant warm-up.
 *
 * This configuration controls whether connection/cache warm-up is performed
 * on application startup and which tenants are considered critical for
 * warm-up.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "fabric.tenant.warmup")
public class TenantWarmupProperties {

    /**
     * Enable tenant warm-up on application startup.
     *
     * When enabled, the application will attempt to warm critical tenants'
     * database connection pools and Redis connectivity during startup.
     */
    private boolean enabled = false;

    /**
     * List of critical tenants to warm on startup.
     *
     * Each entry should correspond to a logical tenant identifier that can be
     * resolved by the warm-up runner (tenant ID or tenant code).
     */
    @NotNull
    private List<String> criticalTenants = List.of();
}
