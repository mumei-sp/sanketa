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
    EMAIL("email"),
    PHONE("phone"),
    SMS("sms"),
    WHATSAPP("whatsapp");
    
    private final String value;
    
    ContactMethod(String value) {
        this.value = value;
    }

    /**
     * Convert string value to ContactMethod enum.
     */
    public static ContactMethod fromValue(String value) {
        if (Objects.isNull(value)) {
            return null;
        }
        for (ContactMethod method : ContactMethod.values()) {
            if (method.value.equalsIgnoreCase(value)) {
                return method;
            }
        }
        return null;
    }
    
    /**
     * Convert string value to ContactMethod enum, throwing exception if invalid.
     */
    public static ContactMethod fromValueOrThrow(String value) {
        if (Objects.isNull(value)) {
            throw new IllegalArgumentException("ContactMethod value cannot be null");
        }
        ContactMethod method = fromValue(value);
        if (Objects.isNull(method)) {
            throw new IllegalArgumentException("Invalid ContactMethod: " + value + ". Valid values are: " + 
                String.join(", ", java.util.Arrays.stream(ContactMethod.values())
                    .map(ContactMethod::getValue)
                    .toArray(String[]::new)));
        }
        return method;
    }
}
