package com.sanketa.fabric.globaldb.service;

import com.sanketa.fabric.globaldb.model.UserTenantResolution;
import com.sanketa.fabric.globaldb.repository.TenantRoutingMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer for resolving tenant routing metadata from the Global DB.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantRoutingMetadataService {

    private final TenantRoutingMetadataRepository tenantRoutingMetadataRepository;

    public List<UserTenantResolution> findTenantResolutionsByKeycloakUserId(String keycloakUserId) {
        return tenantRoutingMetadataRepository.findTenantResolutionsByKeycloakUserId(keycloakUserId);
    }
}
