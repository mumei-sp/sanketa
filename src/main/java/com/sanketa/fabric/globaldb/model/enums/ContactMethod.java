package com.sanketa.fabric.globaldb.model.enums;

/**
 * Preferred contact method codes for a global user profile record.
 */
public enum ContactMethod {

    UNKNOWN(0),
    EMAIL(1),
    PHONE(2),
    SMS(3),
    WHATSAPP(4);

    private final int code;

    ContactMethod(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
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
