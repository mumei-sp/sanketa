package com.sanketa.fabric.globaldb.converter;

import com.sanketa.fabric.database.converter.AbstractEnumCodeConverter;
import com.sanketa.fabric.globaldb.model.enums.UserStatus;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for UserStatus enum to TINYINT (Integer) database column.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class UserStatusConverter extends AbstractEnumCodeConverter<UserStatus> {
    
    public UserStatusConverter() {
        super(UserStatus::getCode, UserStatus::fromCode);
    }
}
