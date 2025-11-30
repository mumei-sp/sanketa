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
    STUDENT("student"),
    TEACHER("teacher"),
    PARENT("parent"),
    ADMIN("admin"),
    STAFF("staff"),
    GUARDIAN("guardian");
    
    private final String value;
    
    ProfileType(String value) {
        this.value = value;
    }

    /**
     * Convert string value to ProfileType enum.
     */
    public static ProfileType fromValue(String value) {
        if (Objects.isNull(value)) {
            return null;
        }
        for (ProfileType type : ProfileType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
    
    /**
     * Convert string value to ProfileType enum, throwing exception if invalid.
     */
    public static ProfileType fromValueOrThrow(String value) {
        if (Objects.isNull(value)) {
            throw new IllegalArgumentException("ProfileType value cannot be null");
        }
        ProfileType type = fromValue(value);
        if (Objects.isNull(type)) {
            throw new IllegalArgumentException("Invalid ProfileType: " + value + ". Valid values are: " + 
                String.join(", ", java.util.Arrays.stream(ProfileType.values())
                    .map(ProfileType::getValue)
                    .toArray(String[]::new)));
        }
        return type;
    }
}
