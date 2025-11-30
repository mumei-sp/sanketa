package com.sanketa.user.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sanketa.user.converter.ContactMethodConverter;
import com.sanketa.user.converter.GenderTypeConverter;
import com.sanketa.user.converter.ProfileTypeConverter;
import com.sanketa.user.domain.enums.ContactMethod;
import com.sanketa.user.domain.enums.GenderType;
import com.sanketa.user.domain.enums.ProfileType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * User profile entity containing personal and contact information.
 * Base class for Student, Teacher, and Parent entities using JOINED inheritance strategy.
 * 
 * @author mumei
 */
@Entity
@Table(name = "user_profiles", indexes = {
    @Index(name = "idx_user_profiles_user_id", columnList = "user_id"),
    @Index(name = "idx_user_profiles_profile_type", columnList = "profile_type")
})
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "profile_type", discriminatorType = DiscriminatorType.INTEGER)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"user", "updatedBy"})
@ToString(exclude = {"user", "updatedBy"})
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true, 
                foreignKey = @ForeignKey(name = "fk_user_profiles_user_id"))
    @JsonIgnore
    private User user;
    
    @Convert(converter = ProfileTypeConverter.class)
    @Column(name = "profile_type", nullable = false, 
            columnDefinition = "TINYINT NOT NULL COMMENT '0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN'")
    private ProfileType profileType;
    
    // Personal information
    @Column(name = "first_name", length = 100, nullable = false)
    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;
    
    @Column(name = "middle_name", length = 100)
    @Size(max = 100, message = "Middle name must not exceed 100 characters")
    private String middleName;
    
    @Column(name = "last_name", length = 100, nullable = false)
    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;
    
    @Column(name = "preferred_name", length = 100)
    private String preferredName;
    
    @Column(name = "display_name", length = 200)
    private String displayName;
    
    @Column(name = "date_of_birth")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    @Convert(converter = GenderTypeConverter.class)
    @Column(name = "gender", columnDefinition = "TINYINT COMMENT '0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY'")
    private GenderType gender;
    
    // Contact information
    @Column(name = "primary_phone", length = 20)
    private String primaryPhone;
    
    @Column(name = "secondary_phone", length = 20)
    private String secondaryPhone;
    
    @Column(name = "emergency_phone", length = 20)
    private String emergencyPhone;
    
    @Convert(converter = ContactMethodConverter.class)
    @Column(name = "preferred_contact_method", 
            columnDefinition = "TINYINT DEFAULT 0 COMMENT '0=EMAIL, 1=PHONE, 2=SMS, 3=WHATSAPP'")
    @Builder.Default
    private ContactMethod preferredContactMethod = ContactMethod.EMAIL;
    
    // Address information
    @Column(name = "address_line1", length = 200)
    private String addressLine1;
    
    @Column(name = "address_line2", length = 200)
    private String addressLine2;
    
    @Column(name = "city", length = 100)
    private String city;
    
    @Column(name = "state_province", length = 100)
    private String stateProvince;
    
    @Column(name = "postal_code", length = 20)
    private String postalCode;
    
    @Column(name = "country", length = 100)
    private String country;
    
    // Profile media
    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    // Privacy settings
    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;
    
    @Column(name = "show_email", nullable = false)
    @Builder.Default
    private Boolean showEmail = false;
    
    @Column(name = "show_phone", nullable = false)
    @Builder.Default
    private Boolean showPhone = false;
    
    // Extensibility for custom fields
    @Column(name = "custom_fields", columnDefinition = "JSON")
    private String customFields;
    
    // Status and metadata
    @Column(name = "last_profile_update", columnDefinition = "DATETIME(6)")
    private LocalDateTime lastProfileUpdate;
    
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", foreignKey = @ForeignKey(name = "fk_user_profiles_updated_by"))
    @JsonIgnore
    private User updatedBy;
    
    @PrePersist
    protected void onCreate() {
        if (Objects.isNull(createdAt)) {
            createdAt = LocalDateTime.now();
        }
        if (Objects.isNull(updatedAt)) {
            updatedAt = LocalDateTime.now();
        }
        lastProfileUpdate = LocalDateTime.now();
        // Auto-generate display name if not provided
        if ((Objects.isNull(displayName) || displayName.isBlank()) && Objects.nonNull(firstName) && Objects.nonNull(lastName)) {
            displayName = getFullName();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastProfileUpdate = LocalDateTime.now();
    }
    
    /**
     * Get full name (first name + last name).
     */
    public String getFullName() {
        if (Objects.nonNull(middleName) && !middleName.isEmpty()) {
            return String.format("%s %s %s", firstName, middleName, lastName);
        }
        return String.format("%s %s", firstName, lastName);
    }
    
    /**
     * Get display name or full name if display name is not set.
     */
    public String getDisplayNameOrDefault() {
        return Objects.nonNull(displayName) && !displayName.isEmpty() ? displayName : getFullName();
    }
}
