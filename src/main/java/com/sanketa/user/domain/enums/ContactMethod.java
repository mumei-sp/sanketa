package com.sanketa.user.domain.enums;

import lombok.Getter;

import java.util.Objects;

/**
 * Preferred contact method enumeration.
 * 
 * @author mumei
 */
@Getter
public enum ContactMethod {
    EMAIL(0, "email"),
    PHONE(1, "phone"),
    SMS(2, "sms"),
    WHATSAPP(3, "whatsapp");
    
    private final int code;
    private final String value;
    
    ContactMethod(int code, String value) {
        this.code = code;
        this.value = value;
    }

    /**
     * Get ContactMethod by integer code, throwing exception if invalid.
     * Used by ContactMethodConverter for safe database mapping.
     */
    public static ContactMethod fromCodeOrThrow(Integer code) {
        if (Objects.isNull(code)) {
            throw new IllegalArgumentException("ContactMethod code cannot be null");
        }
        for (ContactMethod method : ContactMethod.values()) {
            if (method.code == code) {
                return method;
            }
        }
        throw new IllegalArgumentException("Invalid ContactMethod code: " + code + ". Valid codes are: 0-3");
    }
}
