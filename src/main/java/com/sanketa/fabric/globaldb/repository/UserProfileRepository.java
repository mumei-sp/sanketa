package com.sanketa.fabric.globaldb.repository;

import com.sanketa.fabric.globaldb.model.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

/**
 * Repository for accessing {@code user_profiles} table in the Global DB.
 */
@Repository
@RequiredArgsConstructor
public class UserProfileRepository {

    private final JdbcTemplate globalJdbcTemplate;

    private static final RowMapper<UserProfile> USER_PROFILE_ROW_MAPPER = new RowMapper<>() {
        @Override
        public UserProfile mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserProfile.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getLong("user_id"))
                    .profileType(rs.getInt("profile_type"))
                    .firstName(rs.getString("first_name"))
                    .middleName(rs.getString("middle_name"))
                    .lastName(rs.getString("last_name"))
                    .preferredName(rs.getString("preferred_name"))
                    .displayName(rs.getString("display_name"))
                    .dateOfBirth(GlobalDbJdbcUtils.toLocalDate(rs.getDate("date_of_birth")))
                    .gender(rs.getObject("gender") != null ? rs.getInt("gender") : null)
                    .primaryPhone(rs.getString("primary_phone"))
                    .secondaryPhone(rs.getString("secondary_phone"))
                    .emergencyPhone(rs.getString("emergency_phone"))
                    .preferredContactMethod(rs.getObject("preferred_contact_method") != null ? rs.getInt("preferred_contact_method") : null)
                    .addressLine1(rs.getString("address_line1"))
                    .addressLine2(rs.getString("address_line2"))
                    .city(rs.getString("city"))
                    .stateProvince(rs.getString("state_province"))
                    .postalCode(rs.getString("postal_code"))
                    .country(rs.getString("country"))
                    .profilePictureUrl(rs.getString("profile_picture_url"))
                    .bio(rs.getString("bio"))
                    .isPublic(rs.getBoolean("is_public"))
                    .showEmail(rs.getBoolean("show_email"))
                    .showPhone(rs.getBoolean("show_phone"))
                    .customFieldsJson(rs.getString("custom_fields"))
                    .lastProfileUpdate(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("last_profile_update")))
                    .createdAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("created_at")))
                    .updatedAt(GlobalDbJdbcUtils.toOffsetDateTime(rs.getTimestamp("updated_at")))
                    .updatedBy(rs.getObject("updated_by") != null ? rs.getLong("updated_by") : null)
                    .build();
        }
    };

    public Optional<UserProfile> findByUserId(Long userId) {
        String sql = """
                SELECT id,
                       user_id,
                       profile_type,
                       first_name,
                       middle_name,
                       last_name,
                       preferred_name,
                       display_name,
                       date_of_birth,
                       gender,
                       primary_phone,
                       secondary_phone,
                       emergency_phone,
                       preferred_contact_method,
                       address_line1,
                       address_line2,
                       city,
                       state_province,
                       postal_code,
                       country,
                       profile_picture_url,
                       bio,
                       is_public,
                       show_email,
                       show_phone,
                       custom_fields,
                       last_profile_update,
                       created_at,
                       updated_at,
                       updated_by
                FROM user_profiles
                WHERE user_id = ?
                """;
        try {
            UserProfile userProfile = globalJdbcTemplate.queryForObject(sql, USER_PROFILE_ROW_MAPPER, userId);
            return Optional.ofNullable(userProfile);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
