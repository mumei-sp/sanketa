package com.sanketa.fabric.globaldb.service;

import com.sanketa.fabric.globaldb.UseGlobalDb;
import com.sanketa.fabric.globaldb.model.User;
import com.sanketa.fabric.globaldb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service layer for Global DB user operations.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@UseGlobalDb
public class UserService {

    private final UserRepository userRepository;

    public Optional<User> findByKeycloakUserId(String keycloakUserId) {
        return userRepository.findByKeycloakUserId(keycloakUserId);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
