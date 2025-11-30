package com.sanketa.user.converter;

import com.sanketa.user.domain.enums.UserStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Objects;

/**
 * JPA AttributeConverter for UserStatus enum to TINYINT (Integer) database column.
 * 
 * This converter explicitly maps enum values to integer codes, making it safer
 * than using @Enumerated(EnumType.ORDINAL) which relies on declaration order.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class UserStatusConverter implements AttributeConverter<UserStatus, Integer> {
    
    @Override
    public Integer convertToDatabaseColumn(UserStatus status) {
        if (Objects.isNull(status)) {
            return null;
        }
        return status.getCode();
    }
    
    @Override
    public UserStatus convertToEntityAttribute(Integer code) {
        if (Objects.isNull(code)) {
            return null;
        }
        return UserStatus.fromCodeOrThrow(code);
    }
}
