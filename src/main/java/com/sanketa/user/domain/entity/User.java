package com.sanketa.user.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sanketa.user.converter.UserStatusConverter;
import com.sanketa.user.domain.enums.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Core user entity representing user accounts in the tenant database.
 * 
 * @author mumei
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_username", columnList = "username"),
    @Index(name = "idx_users_status", columnList = "status"),
    @Index(name = "idx_users_is_active", columnList = "is_active"),
    @Index(name = "idx_users_created_at", columnList = "created_at"),
    @Index(name = "idx_users_phone", columnList = "phone"),
    @Index(name = "idx_users_deleted_at", columnList = "deleted_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"profile", "createdBy", "updatedBy"})
@ToString(exclude = {"profile", "createdBy", "updatedBy"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "username", length = 255, unique = true)
    @Size(min = 3, message = "Username must be at least 3 characters long")
    private String username;
    
    @Column(name = "email", length = 255, unique = true, nullable = false)
    @Email(message = "Email must be a valid email address")
    @NotBlank(message = "Email is required")
    private String email;
    
    @Column(name = "email_verified_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime emailVerifiedAt;
    
    @Column(name = "phone", length = 20)
    @Pattern(regexp = "^\\+91[6-9]\\d{9}$", message = "Phone must be a valid Indian phone number (+91XXXXXXXXXX)")
    private String phone;
    
    @Column(name = "phone_verified_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime phoneVerifiedAt;
    
    @Convert(converter = UserStatusConverter.class)
    @Column(name = "status", columnDefinition = "TINYINT DEFAULT 3", nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_VERIFICATION;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "deleted_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime deletedAt;
    
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", foreignKey = @ForeignKey(name = "fk_users_created_by"))
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", foreignKey = @ForeignKey(name = "fk_users_updated_by"))
    private User updatedBy;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private UserProfile profile;
    
    @PrePersist
    protected void onCreate() {
        if (Objects.isNull(createdAt)) {
            createdAt = LocalDateTime.now();
        }
        if (Objects.isNull(updatedAt)) {
            updatedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Check if user is soft deleted.
     */
    public boolean isDeleted() {
        return Objects.nonNull(deletedAt);
    }
    
    /**
     * Soft delete the user.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.isActive = false;
    }
    
    /**
     * Restore a soft-deleted user.
     */
    public void restore() {
        this.deletedAt = null;
        this.isActive = true;
    }
    
    /**
     * Check if user has an active account (active status, not deleted, and verified).
     */
    public boolean isActiveAccount() {
        return isActive && status == UserStatus.ACTIVE && !isDeleted() && isVerified;
    }
    
    /**
     * Check if user can perform actions (not deleted, not suspended, not locked).
     */
    public boolean canPerformActions() {
        return !isDeleted() && status != UserStatus.SUSPENDED && status != UserStatus.LOCKED;
    }
}
