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
    ACTIVE("active", 0),
    INACTIVE("inactive", 1),
    SUSPENDED("suspended", 2),
    PENDING_VERIFICATION("pending_verification", 3),  // Default value
    LOCKED("locked", 4);
    
    private final String value;
    private final int code;
    
    UserStatus(String value, int code) {
        this.value = value;
        this.code = code;
    }
    
    /**
     * Get UserStatus by integer code.
     * 
     * @param code the integer code
     * @return the corresponding UserStatus, or null if not found
     */
    public static UserStatus fromCode(Integer code) {
        if (Objects.isNull(code)) {
            return null;
        }
        for (UserStatus status : UserStatus.values()) {
            if (status.code == code) {
                return status;
            }
        }
        return null;
    }
    
    /**
     * Get UserStatus by integer code, throwing exception if invalid.
     */
    public static UserStatus fromCodeOrThrow(Integer code) {
        if (Objects.isNull(code)) {
            throw new IllegalArgumentException("UserStatus code cannot be null");
        }
        UserStatus status = fromCode(code);
        if (Objects.isNull(status)) {
            throw new IllegalArgumentException("Invalid UserStatus code: " + code + ". Valid codes are: 0-4");
        }
        return status;
    }
}
