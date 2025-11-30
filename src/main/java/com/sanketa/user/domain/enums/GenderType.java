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
    MALE("male"),
    FEMALE("female"),
    OTHER("other"),
    PREFER_NOT_TO_SAY("prefer_not_to_say");
    
    private final String value;
    
    GenderType(String value) {
        this.value = value;
    }

    /**
     * Convert string value to GenderType enum.
     * 
     * @param value the string value
     * @return the corresponding GenderType, or null if not found
     */
    public static GenderType fromValue(String value) {
        if (Objects.isNull(value)) {
            return null;
        }
        for (GenderType gender : GenderType.values()) {
            if (gender.value.equalsIgnoreCase(value)) {
                return gender;
            }
        }
        return null;
    }
    
    /**
     * Convert string value to GenderType enum, throwing exception if invalid.
     * 
     * @param value the string value
     * @return the corresponding GenderType
     * @throws IllegalArgumentException if the value is invalid
     */
    public static GenderType fromValueOrThrow(String value) {
        if (Objects.isNull(value)) {
            throw new IllegalArgumentException("GenderType value cannot be null");
        }
        GenderType gender = fromValue(value);
        if (Objects.isNull(gender)) {
            throw new IllegalArgumentException("Invalid GenderType: " + value + ". Valid values are: " + 
                String.join(", ", java.util.Arrays.stream(GenderType.values())
                    .map(GenderType::getValue)
                    .toArray(String[]::new)));
        }
        return gender;
    }
}
