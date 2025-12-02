package com.sanketa.fabric.globaldb.model.enums;

import lombok.Getter;

/**
 * Preferred contact method codes for a global user profile record.
 */
@Getter
public enum ContactMethod {

    EMAIL(0),
    PHONE(1),
    SMS(2),
    WHATSAPP(3);

    private final int code;

    ContactMethod(int code) {
        this.code = code;
    }

    public static ContactMethod fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (ContactMethod method : values()) {
            if (method.code == code) {
                return method;
            }
        }
        throw new IllegalArgumentException("Unknown ContactMethod code: " + code);
    }

    public static ContactMethod fromCodeOrDefault(Integer code, ContactMethod defaultValue) {
        if (code == null) {
            return defaultValue;
        }
        return fromCode(code);
    }
}
