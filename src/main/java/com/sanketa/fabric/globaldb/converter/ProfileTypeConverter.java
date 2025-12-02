package com.sanketa.fabric.globaldb.converter;

import com.sanketa.fabric.database.converter.AbstractEnumCodeConverter;
import com.sanketa.fabric.globaldb.model.enums.ProfileType;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ProfileType enum to TINYINT (Integer) database column.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class ProfileTypeConverter extends AbstractEnumCodeConverter<ProfileType> {
    
    public ProfileTypeConverter() {
        super(ProfileType::getCode, ProfileType::fromCode);
    }
}
