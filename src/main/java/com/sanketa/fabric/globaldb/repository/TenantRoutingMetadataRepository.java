package com.sanketa.fabric.globaldb.repository;

import com.sanketa.fabric.globaldb.model.UserTenantResolution;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Repository for accessing the {@code v_user_tenant_resolution} view
 * in the Global DB.
 */
@Repository
@RequiredArgsConstructor
public class TenantRoutingMetadataRepository {

    private final JdbcTemplate globalJdbcTemplate;

    private static final RowMapper<UserTenantResolution> RESOLUTION_ROW_MAPPER = new RowMapper<>() {
        @Override
        public UserTenantResolution mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserTenantResolution.builder()
                    .userId(rs.getLong("user_id"))
                    .keycloakUserId(rs.getString("keycloak_user_id"))
                    .tenantId(rs.getLong("tenant_id"))
                    .tenantCode(rs.getString("tenant_code"))
                    .tenantName(rs.getString("tenant_name"))
                    .databaseInstanceId(rs.getLong("database_instance_id"))
                    .databaseInstanceName(rs.getString("database_instance_name"))
                    .databaseHost(rs.getString("database_host"))
                    .databasePort(rs.getInt("database_port"))
                    .databaseType(rs.getString("database_type"))
                    .connectionStringEncrypted(rs.getString("connection_string_encrypted"))
                    .encryptionKeyId(rs.getString("encryption_key_id"))
                    .dbHealthy(rs.getBoolean("db_healthy"))
                    .tenantSchema(rs.getString("tenant_schema"))
                    .build();
        }
    };

    /**
     * Resolve all tenant mappings for a given Keycloak user ID
     * using {@code v_user_tenant_resolution}.
     */
    public List<UserTenantResolution> findTenantResolutionsByKeycloakUserId(String keycloakUserId) {
        String sql = """
                SELECT user_id,
                       keycloak_user_id,
                       tenant_id,
                       tenant_code,
                       tenant_name,
                       database_instance_id,
                       database_instance_name,
                       database_host,
                       database_port,
                       database_type,
                       connection_string_encrypted,
                       encryption_key_id,
                       db_healthy,
                       tenant_schema
                FROM v_user_tenant_resolution
                WHERE keycloak_user_id = ?
                """;
        return globalJdbcTemplate.query(sql, RESOLUTION_ROW_MAPPER, keycloakUserId);
    }
}
