package com.sanketa.fabric.globaldb.model.enums;

import lombok.Getter;

/**
 * Gender codes for a global user profile record.
 */
@Getter
public enum Gender {

    MALE(0),
    FEMALE(1),
    OTHER(2),
    PREFER_NOT_TO_SAY(3);

    private final int code;

    Gender(int code) {
        this.code = code;
    }

    public static Gender fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (Gender gender : values()) {
            if (gender.code == code) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Unknown Gender code: " + code);
    }

    public static Gender fromCodeOrDefault(Integer code, Gender defaultValue) {
        if (code == null) {
            return defaultValue;
        }
        return fromCode(code);
    }
}
