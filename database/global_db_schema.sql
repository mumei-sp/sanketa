-- ============================================================================
-- Global Database Schema for Sanketa Fabric Layer
-- ============================================================================
-- 
-- PURPOSE:
-- This schema defines the Global Database for the Fabric layer, which
-- handles tenant resolution and database routing in a multi-tenant architecture.
--
-- ARCHITECTURE:
-- - Multiple physical database instances (horizontal scaling)
-- - Multiple schemas per database (one schema per tenant)
-- - Users can belong to multiple tenants (schools)
-- - Keycloak handles authentication (user details stored there)
-- - Tenant DBs store all school-specific data and roles
--
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- users: User mapping table
-- ----------------------------------------------------------------------------
-- Links Keycloak user IDs to internal user IDs. All user details (name, email,
-- profile) are stored in Keycloak. This table only maintains the mapping.
--
-- Key Fields:
--   - keycloak_user_id: Keycloak user UUID (source of truth for user identity)
--   - is_active: Enable/disable user access without deleting
--
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keycloak_user_id VARCHAR(255) UNIQUE NOT NULL, -- Keycloak user UUID
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- User access status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    INDEX idx_users_keycloak_user_id (keycloak_user_id),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- tenants: Tenant (school) information
-- ----------------------------------------------------------------------------
-- Stores basic tenant identification for routing. All detailed school
-- information (address, configuration, etc.) is stored in Tenant DBs.
--
-- Key Fields:
--   - tenant_code: Unique identifier for routing (e.g., "SCHOOL_001")
--   - name: Display name (minimal, for logging/debugging)
--
CREATE TABLE tenants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL, -- Unique routing identifier
    name VARCHAR(255) NOT NULL, -- Display name
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Tenant access status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    INDEX idx_tenants_tenant_code (tenant_code),
    INDEX idx_tenants_is_active (is_active),
    INDEX idx_tenants_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- user_tenant_mapping
-- ----------------------------------------------------------------------------
-- Maps users to their associated tenants (schools). This is the core table
-- for tenant resolution. A user can belong to multiple tenants.
--
-- Key Fields:
--   - user_id: Reference to users table
--   - tenant_id: Reference to tenants table
--   - is_active: Enable/disable this specific user-tenant relationship
--
-- Constraints:
--   - Unique (user_id, tenant_id) to prevent duplicate mappings
--
CREATE TABLE user_tenant_mapping (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL, -- Foreign key to users
    tenant_id BIGINT UNSIGNED NOT NULL, -- Foreign key to tenants
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Mapping active status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    CONSTRAINT user_tenant_mapping_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_tenant_mapping_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_tenant (user_id, tenant_id),
    INDEX idx_user_tenant_mapping_user_id (user_id, is_deleted, is_active),
    INDEX idx_user_tenant_mapping_tenant_id (tenant_id, is_deleted, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- database_instances
-- ----------------------------------------------------------------------------
-- Stores metadata for each physical database instance used for horizontal
-- scaling. Multiple tenants can share the same database instance (each in
-- their own schema). Connection credentials are stored separately in
-- database_instance_credentials for security and access control.
--
-- Key Fields:
--   - instance_name: Unique identifier (e.g., "sanketa_db_1", "sanketa_db_2")
--   - database_host, database_port: Connection metadata
--   - is_healthy: Health check status for routing decisions
--   - max_tenants: Optional capacity limit for load balancing
--   - current_tenant_count: Current tenant count (for load balancing)
--
-- Constraints:
--   - current_tenant_count <= max_tenants (if max_tenants is set)
--   - current_tenant_count >= 0
--
CREATE TABLE database_instances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE NOT NULL, -- Unique database instance name
    database_host VARCHAR(255) NOT NULL, -- Database host address
    database_port INTEGER NOT NULL DEFAULT 3306, -- Database port (MySQL default)
    database_type VARCHAR(50) DEFAULT 'MYSQL', -- Database type
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Instance active status
    is_healthy BOOLEAN DEFAULT TRUE NOT NULL, -- Health check status
    last_health_check_at TIMESTAMP NULL, -- Last health check timestamp
    max_tenants INTEGER, -- Optional: Maximum tenants this instance can hold
    current_tenant_count INTEGER DEFAULT 0, -- Current tenant count (for load balancing)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    CONSTRAINT database_instances_db_type_check CHECK (database_type IN ('POSTGRESQL', 'MYSQL', 'MARIADB', 'MSSQL')),
    CONSTRAINT check_tenant_count CHECK (max_tenants IS NULL OR current_tenant_count <= max_tenants),
    CONSTRAINT check_tenant_count_positive CHECK (current_tenant_count >= 0),
    INDEX idx_database_instances_instance_name (instance_name, is_deleted),
    INDEX idx_database_instances_is_healthy (is_healthy, is_deleted, is_active),
    INDEX idx_database_instances_is_active (is_active, is_deleted),
    INDEX idx_database_instances_tenant_count (current_tenant_count, is_deleted, is_active, is_healthy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- tenant_database_mapping
-- ----------------------------------------------------------------------------
-- Maps each tenant to its database instance and schema. This is critical for
-- database routing. Each tenant has exactly one mapping (one-to-one).
--
-- Key Fields:
--   - tenant_id: Reference to tenant (UNIQUE - one mapping per tenant)
--   - database_instance_id: Reference to database instance
--   - tenant_schema: Tenant's schema name within that database
--
-- Constraints:
--   - Unique (database_instance_id, tenant_schema) prevents schema conflicts
--
CREATE TABLE tenant_database_mapping (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED UNIQUE NOT NULL, -- Foreign key to tenants (one mapping per tenant)
    database_instance_id BIGINT UNSIGNED NOT NULL, -- Foreign key to database_instances
    tenant_schema VARCHAR(100) NOT NULL, -- Tenant's schema name within database
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Mapping active status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    CONSTRAINT tenant_db_mapping_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT tenant_db_mapping_instance_fk FOREIGN KEY (database_instance_id) REFERENCES database_instances(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_instance_schema (database_instance_id, tenant_schema),
    INDEX idx_tenant_db_mapping_tenant_id (tenant_id, is_deleted, is_active),
    INDEX idx_tenant_db_mapping_instance_id (database_instance_id, is_deleted, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- database_instance_credentials
-- ----------------------------------------------------------------------------
-- Stores encrypted connection credentials for database instances. Separated
-- from database_instances for security: credentials rotate more often, require
-- separate access controls, and should have different permissions than metadata.
--
-- Key Fields:
--   - database_instance_id: Reference to database instance (one-to-one)
--   - connection_string_encrypted: Full encrypted connection string
--   - encryption_key_id: Reference to encryption key for decryption
--
-- Constraints:
--   - One credential record per database instance (UNIQUE)
--
CREATE TABLE database_instance_credentials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    database_instance_id BIGINT UNSIGNED UNIQUE NOT NULL, -- Foreign key to database_instances (one-to-one)
    connection_string_encrypted TEXT NOT NULL, -- Encrypted full connection string
    encryption_key_id VARCHAR(255) NOT NULL, -- Reference to encryption key for decryption
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete flag
    CONSTRAINT db_credentials_instance_fk FOREIGN KEY (database_instance_id) REFERENCES database_instances(id) ON DELETE CASCADE,
    INDEX idx_db_credentials_instance_id (database_instance_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- fabric_sessions
-- ----------------------------------------------------------------------------
-- Tracks active Fabric session context tokens for validation and revocation.
-- Stores hashed tokens (not actual tokens) for security.
--
-- Key Fields:
--   - session_token_hash: Hashed Fabric JWT token (UNIQUE)
--   - keycloak_token_hash: Hashed Keycloak token reference (optional)
--   - issued_at, expires_at: Token lifecycle
--   - last_accessed_at: Last access time (updated on each request)
--   - is_active: Session active status
--   - revoked_at: Revocation timestamp (if revoked)
--
-- Constraints:
--   - expires_at > issued_at (ensures valid expiration)
--
CREATE TABLE fabric_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL, -- Foreign key to users
    session_token_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed Fabric JWT token
    keycloak_token_hash VARCHAR(255), -- Hashed Keycloak token reference (optional)
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Token issue time
    expires_at TIMESTAMP NOT NULL, -- Token expiration time
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Last access time
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Session active status
    revoked_at TIMESTAMP NULL, -- Revocation timestamp (if revoked)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fabric_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_session_dates CHECK (expires_at > issued_at),
    INDEX idx_fabric_sessions_user_id (user_id, is_active),
    INDEX idx_fabric_sessions_token_hash (session_token_hash, is_active),
    INDEX idx_fabric_sessions_expires_at (expires_at, is_active),
    INDEX idx_fabric_sessions_user_active_expires (user_id, is_active, expires_at),
    INDEX idx_fabric_sessions_keycloak_hash (keycloak_token_hash, is_active),
    INDEX idx_fabric_sessions_cleanup (expires_at, is_active),
    INDEX idx_fabric_sessions_revoked (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- v_user_tenant_resolution
-- ----------------------------------------------------------------------------
-- This view provides a complete mapping from user to tenant to database
-- routing information. It's the primary view used by Fabric for tenant
-- resolution and database routing.
--
-- Returns:
--   - User information (id, keycloak_user_id)
--   - Tenant information (id, tenant_code, name)
--   - Database instance information (id, instance_name, host, port, type)
--   - Connection details (encrypted connection string, encryption key)
--   - Tenant schema name
--   - Database health status
--
-- Usage: Query by keycloak_user_id to get all tenants and routing info for a user
--
CREATE OR REPLACE VIEW v_user_tenant_resolution AS
SELECT 
    u.id AS user_id,
    u.keycloak_user_id,
    t.id AS tenant_id,
    t.tenant_code,
    t.name AS tenant_name,
    di.id AS database_instance_id,
    di.instance_name AS database_instance_name,
    di.database_host,
    di.database_port,
    di.database_type,
    dic.connection_string_encrypted,
    dic.encryption_key_id,
    di.is_healthy AS db_healthy,
    tdm.tenant_schema
FROM users u
INNER JOIN user_tenant_mapping utm ON u.id = utm.user_id
INNER JOIN tenants t ON utm.tenant_id = t.id
INNER JOIN tenant_database_mapping tdm ON t.id = tdm.tenant_id
INNER JOIN database_instances di ON tdm.database_instance_id = di.id
LEFT JOIN database_instance_credentials dic ON di.id = dic.database_instance_id
WHERE u.is_deleted = FALSE 
    AND u.is_active = TRUE
    AND utm.is_deleted = FALSE
    AND utm.is_active = TRUE
    AND t.is_deleted = FALSE
    AND t.is_active = TRUE
    AND tdm.is_deleted = FALSE
    AND tdm.is_active = TRUE
    AND di.is_deleted = FALSE
    AND di.is_active = TRUE
    AND (dic.is_deleted = FALSE OR dic.is_deleted IS NULL);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
