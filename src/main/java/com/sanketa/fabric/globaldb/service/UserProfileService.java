package com.sanketa.fabric.globaldb.service;

import com.sanketa.fabric.globaldb.UseGlobalDb;
import com.sanketa.fabric.globaldb.model.UserProfile;
import com.sanketa.fabric.globaldb.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service layer for Global DB user profile operations.
 *
 * NOTE: This service is primarily used for syncing profiles to tenant DBs.
 * Most profile reads happen from the denormalized tenant DB tables for performance.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@UseGlobalDb
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    /**
     * Find profile by user ID.
     */
    public Optional<UserProfile> findByUserId(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return userProfileRepository.findByUserId(userId);
    }

    /**
     * Find profile by profile ID.
     */
    public Optional<UserProfile> findById(Long profileId) {
        if (profileId == null) {
            return Optional.empty();
        }
        return userProfileRepository.findById(profileId);
    }
}
