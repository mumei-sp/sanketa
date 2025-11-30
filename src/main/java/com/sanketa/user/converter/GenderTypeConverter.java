package com.sanketa.user.converter;

import com.sanketa.user.domain.enums.GenderType;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for GenderType enum to TINYINT (Integer) database column.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class GenderTypeConverter extends AbstractEnumCodeConverter<GenderType> {
    
    public GenderTypeConverter() {
        super(GenderType::getCode, GenderType::fromCodeOrThrow);
    }
}

