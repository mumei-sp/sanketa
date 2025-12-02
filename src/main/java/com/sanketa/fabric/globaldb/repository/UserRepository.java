package com.sanketa.fabric.globaldb.repository;

import com.sanketa.fabric.globaldb.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

/**
 * Repository for accessing {@code users} table in the Global DB.
 */
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final JdbcTemplate globalJdbcTemplate;

    private static final String USER_COLUMNS = """
            id,
            keycloak_user_id,
            username,
            email,
            email_verified_at,
            phone,
            phone_verified_at,
            status,
            is_active,
            is_verified,
            deleted_at,
            is_deleted,
            created_at,
            updated_at,
            created_by,
            updated_by
            """;

    private static final RowMapper<User> USER_ROW_MAPPER = new RowMapper<>() {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            return User.builder()
                    .id(rs.getLong("id"))
                    .keycloakUserId(rs.getString("keycloak_user_id"))
                    .username(rs.getString("username"))
                    .email(rs.getString("email"))
                    .emailVerifiedAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("email_verified_at")))
                    .phone(rs.getString("phone"))
                    .phoneVerifiedAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("phone_verified_at")))
                    .status(rs.getInt("status"))
                    .isActive(rs.getBoolean("is_active"))
                    .isVerified(rs.getBoolean("is_verified"))
                    .deletedAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("deleted_at")))
                    .isDeleted(rs.getBoolean("is_deleted"))
                    .createdAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("created_at")))
                    .updatedAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("updated_at")))
                    .createdBy(rs.getObject("created_by") != null ? rs.getLong("created_by") : null)
                    .updatedBy(rs.getObject("updated_by") != null ? rs.getLong("updated_by") : null)
                    .build();
        }
    };

    public Optional<User> findByKeycloakUserId(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isBlank()) {
            return Optional.empty();
        }
        
        String sql = "SELECT " + USER_COLUMNS + " FROM users WHERE keycloak_user_id = ? AND is_deleted = FALSE";
        try {
            User user = globalJdbcTemplate.queryForObject(sql, USER_ROW_MAPPER, keycloakUserId);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        
        String sql = "SELECT " + USER_COLUMNS + " FROM users WHERE id = ? AND is_deleted = FALSE";
        try {
            User user = globalJdbcTemplate.queryForObject(sql, USER_ROW_MAPPER, id);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
