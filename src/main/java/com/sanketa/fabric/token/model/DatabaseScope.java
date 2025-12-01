package com.sanketa.fabric.token.model;

/**
 * Advisory database scope for the current request.
 *
 * This is a lightweight hint used for:
 * - Logging and debugging
 * - Optional guardrails (e.g., avoid tenant repos when in GLOBAL scope)
 *
 * IMPORTANT:
 * - GLOBAL scope operations must use the dedicated Global DB access path
 *   (e.g., globalJdbcTemplate-backed services).
 * - TENANT scope operations must use tenant-aware infrastructure
 *   (e.g., TenantRoutingDataSource and tenant JPA repositories).
 */
public enum DatabaseScope {
    GLOBAL,
    TENANT
}
