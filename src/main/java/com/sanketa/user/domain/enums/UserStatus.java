package com.sanketa.user.domain.enums;

import lombok.Getter;

import java.util.Objects;

/**
 * User account status enumeration.
 * 
 * @author mumei
 */
@Getter
public enum UserStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    SUSPENDED("suspended"),
    PENDING_VERIFICATION("pending_verification"),
    LOCKED("locked");
    
    private final String value;
    
    UserStatus(String value) {
        this.value = value;
    }

    /**
     * Convert string value to UserStatus enum.
     */
    public static UserStatus fromValue(String value) {
        if (Objects.isNull(value)) {
            return null;
        }
        for (UserStatus status : UserStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        return null;
    }
    
    /**
     * Convert string value to UserStatus enum, throwing exception if invalid.
     */
    public static UserStatus fromValueOrThrow(String value) {
        if (Objects.isNull(value)) {
            throw new IllegalArgumentException("UserStatus value cannot be null");
        }
        UserStatus status = fromValue(value);
        if (Objects.isNull(status)) {
            throw new IllegalArgumentException("Invalid UserStatus: " + value + ". Valid values are: " + 
                String.join(", ", java.util.Arrays.stream(UserStatus.values())
                    .map(UserStatus::getValue)
                    .toArray(String[]::new)));
        }
        return status;
    }
}
