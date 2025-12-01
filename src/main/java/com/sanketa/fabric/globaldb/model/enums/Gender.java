package com.sanketa.fabric.globaldb.model.enums;

/**
 * Gender codes for a global user profile record.
 */
public enum Gender {

    UNKNOWN(0),
    MALE(1),
    FEMALE(2),
    OTHER(3);

    private final int code;

    Gender(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
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
