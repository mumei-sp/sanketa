package com.sanketa.user.domain.enums;

import lombok.Getter;

import java.util.Objects;

/**
 * User profile type enumeration.
 *
 * @author mumei
 */
@Getter
public enum ProfileType {
    STUDENT(0, "student"),
    TEACHER(1, "teacher"),
    PARENT(2, "parent"),
    ADMIN(3, "admin"),
    STAFF(4, "staff"),
    GUARDIAN(5, "guardian");
    
    private final int code;
    private final String value;
    
    ProfileType(int code, String value) {
        this.code = code;
        this.value = value;
    }
    
    /**
     * Get ProfileType by integer code, throwing exception if invalid.
     * Used by ProfileTypeConverter for safe database mapping.
     */
    public static ProfileType fromCodeOrThrow(Integer code) {
        if (Objects.isNull(code)) {
            throw new IllegalArgumentException("ProfileType code cannot be null");
        }
        for (ProfileType type : ProfileType.values()) {
            if (type.code == code) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid ProfileType code: " + code + ". Valid codes are: 0-5");
    }
}
