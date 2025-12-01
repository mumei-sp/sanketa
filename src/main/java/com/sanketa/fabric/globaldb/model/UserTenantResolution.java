package com.sanketa.fabric.globaldb.model;

import lombok.Builder;
import lombok.Value;

/**
 * Immutable representation of a row from the Global DB view
 * {@code v_user_tenant_resolution}.
 */
@Value
@Builder
public class UserTenantResolution {

    Long userId;
    String keycloakUserId;
    Long tenantId;
    String tenantCode;
    String tenantName;

    Long databaseInstanceId;
    String databaseInstanceName;
    String databaseHost;
    Integer databasePort;
    String databaseType;

    String connectionStringEncrypted;
    String encryptionKeyId;
    Boolean dbHealthy;

    String tenantSchema;
}
