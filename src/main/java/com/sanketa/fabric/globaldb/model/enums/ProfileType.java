package com.sanketa.fabric.globaldb.model.enums;

/**
 * Profile type codes for a global user profile record.
 */
public enum ProfileType {

    UNKNOWN(0),
    STUDENT(1),
    TEACHER(2),
    PARENT(3),
    ADMIN(4);

    private final int code;

    ProfileType(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
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
