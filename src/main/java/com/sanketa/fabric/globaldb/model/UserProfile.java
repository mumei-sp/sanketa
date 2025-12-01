package com.sanketa.fabric.globaldb.model;

import com.sanketa.fabric.globaldb.model.enums.ContactMethod;
import com.sanketa.fabric.globaldb.model.enums.Gender;
import com.sanketa.fabric.globaldb.model.enums.ProfileType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Immutable representation of a row from the Global DB {@code user_profiles} table.
 */
@Value
@Builder
public class UserProfile {

    Long id;

    Long userId;
    /**
     * Profile type code, see {@link ProfileType} for type-safe access.
     */
    Integer profileType;

    // Personal information
    String firstName;
    String middleName;
    String lastName;
    String preferredName;
    String displayName;
    LocalDate dateOfBirth;
    /**
     * Gender code, see {@link Gender} for type-safe access.
     */
    Integer gender;

    // Contact information
    String primaryPhone;
    String secondaryPhone;
    String emergencyPhone;
    /**
     * Preferred contact method code, see {@link ContactMethod} for type-safe access.
     */
    Integer preferredContactMethod;

    // Address information
    String addressLine1;
    String addressLine2;
    String city;
    String stateProvince;
    String postalCode;
    String country;

    // Profile media
    String profilePictureUrl;
    String bio;

    // Privacy settings
    Boolean isPublic;
    Boolean showEmail;
    Boolean showPhone;

    // Extensibility for custom fields (stored as JSON in the DB)
    String customFieldsJson;

    // Status and metadata
    OffsetDateTime lastProfileUpdate;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
    Long updatedBy;

    /**
     * Type-safe view over the {@link #profileType} code.
     */
    public ProfileType getProfileTypeEnum() {
        return ProfileType.fromCode(profileType);
    }

    /**
     * Type-safe view over the {@link #gender} code.
     */
    public Gender getGenderEnum() {
        return Gender.fromCode(gender);
    }

    /**
     * Type-safe view over the {@link #preferredContactMethod} code.
     */
    public ContactMethod getPreferredContactMethodEnum() {
        return ContactMethod.fromCode(preferredContactMethod);
    }
}
