package com.sanketa.user.domain.enums;

import lombok.Getter;

import java.util.Objects;

/**
 * Gender type enumeration.
 *
 * @author mumei
 */
@Getter
public enum GenderType {
    MALE(0, "male"),
    FEMALE(1, "female"),
    OTHER(2, "other"),
    PREFER_NOT_TO_SAY(3, "prefer_not_to_say");
    
    private final int code;
    private final String value;
    
    GenderType(int code, String value) {
        this.code = code;
        this.value = value;
    }

    /**
     * Get GenderType by integer code, throwing exception if invalid.
     * Used by GenderTypeConverter for safe database mapping.
     */
    public static GenderType fromCodeOrThrow(Integer code) {
        if (Objects.isNull(code)) {
            throw new IllegalArgumentException("GenderType code cannot be null");
        }
        for (GenderType gender : GenderType.values()) {
            if (gender.code == code) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Invalid GenderType code: " + code + ". Valid codes are: 0-3");
    }
}
