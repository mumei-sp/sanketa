package com.sanketa.user.converter;

import com.sanketa.user.domain.enums.UserStatus;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for UserStatus enum to TINYINT (Integer) database column.
 * 
 * This converter explicitly maps enum values to integer codes, making it safer
 * than using @Enumerated(EnumType.ORDINAL) which relies on declaration order.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class UserStatusConverter extends AbstractEnumCodeConverter<UserStatus> {
    
    public UserStatusConverter() {
        super(UserStatus::getCode, UserStatus::fromCodeOrThrow);
    }
}
