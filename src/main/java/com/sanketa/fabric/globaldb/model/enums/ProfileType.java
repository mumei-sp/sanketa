package com.sanketa.fabric.globaldb.model.enums;

import lombok.Getter;

/**
 * Profile type codes for a global user profile record.
 */
@Getter
public enum ProfileType {

    STUDENT(0),
    TEACHER(1),
    PARENT(2),
    ADMIN(3),
    STAFF(4),
    GUARDIAN(5);

    private final int code;

    ProfileType(int code) {
        this.code = code;
    }

    public static ProfileType fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (ProfileType type : values()) {
            if (type.code == code) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ProfileType code: " + code);
    }

    public static ProfileType fromCodeOrDefault(Integer code, ProfileType defaultValue) {
        if (code == null) {
            return defaultValue;
        }
        return fromCode(code);
    }
}
