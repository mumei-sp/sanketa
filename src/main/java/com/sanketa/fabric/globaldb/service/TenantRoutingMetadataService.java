package com.sanketa.fabric.globaldb.service;

import com.sanketa.fabric.globaldb.UseGlobalDb;
import com.sanketa.fabric.globaldb.model.UserTenantResolution;
import com.sanketa.fabric.globaldb.repository.TenantRoutingMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

/**
 * Service layer for resolving tenant routing metadata from the Global DB.
 * 
 * NOTE: This service is primarily used during token generation to resolve
 * user tenant memberships.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@UseGlobalDb
public class TenantRoutingMetadataService {

    private final TenantRoutingMetadataRepository tenantRoutingMetadataRepository;

    /**
     * Find tenant resolutions by Keycloak user ID.
     * 
     * @param keycloakUserId The Keycloak user ID
     * @return List of tenant resolutions for the user, empty list if not found or invalid input
     */
    public List<UserTenantResolution> findTenantResolutionsByKeycloakUserId(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isBlank()) {
            return Collections.emptyList();
        }
        
        return tenantRoutingMetadataRepository.findTenantResolutionsByKeycloakUserId(keycloakUserId);
    }
}
