package com.sanketa.fabric.globaldb.model.enums;

import lombok.Getter;

/**
 * Status flags for a global user record.
 */
@Getter
public enum UserStatus {

    ACTIVE(0),
    INACTIVE(1),
    SUSPENDED(2),
    PENDING_VERIFICATION(3),
    LOCKED(4);

    private final int code;

    UserStatus(int code) {
        this.code = code;
    }

    public static UserStatus fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (UserStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown UserStatus code: " + code);
    }

    public static UserStatus fromCodeOrDefault(Integer code, UserStatus defaultValue) {
        if (code == null) {
            return defaultValue;
        }
        return fromCode(code);
    }
}
