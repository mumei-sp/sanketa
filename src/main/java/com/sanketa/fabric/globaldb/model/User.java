package com.sanketa.fabric.globaldb.model;

import com.sanketa.fabric.globaldb.model.enums.UserStatus;
import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

/**
 * Immutable representation of a user row from the Global DB {@code users} table.
 */
@Value
@Builder
public class User {

    Long id;

    // Identity fields
    String keycloakUserId;
    String username;
    String email;

    OffsetDateTime emailVerifiedAt;

    String phone;
    OffsetDateTime phoneVerifiedAt;

    // Account status and flags (see {@link GlobalUserStatus} for type-safe access)
    Integer status;        // 0=ACTIVE,1=INACTIVE,2=SUSPENDED,3=PENDING_VERIFICATION,4=LOCKED
    Boolean isActive;
    Boolean isVerified;

    OffsetDateTime deletedAt;
    Boolean isDeleted;

    // Audit fields
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
    Long createdBy;
    Long updatedBy;

    /**
     * Type-safe view over the {@link #status} code.
     */
    public UserStatus getStatusEnum() {
        return UserStatus.fromCode(status);
    }
}
