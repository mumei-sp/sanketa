package com.sanketa.user.converter;

import com.sanketa.user.domain.enums.ProfileType;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ProfileType enum to TINYINT (Integer) database column.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class ProfileTypeConverter extends AbstractEnumCodeConverter<ProfileType> {
    
    public ProfileTypeConverter() {
        super(ProfileType::getCode, ProfileType::fromCodeOrThrow);
    }
}

