package com.sanketa.fabric.globaldb.converter;

import com.sanketa.fabric.database.converter.AbstractEnumCodeConverter;
import com.sanketa.fabric.globaldb.model.enums.Gender;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for Gender enum to TINYINT (Integer) database column.
 *
 * @author mumei
 */
@Converter(autoApply = false)
public class GenderTypeConverter extends AbstractEnumCodeConverter<Gender> {
    
    public GenderTypeConverter() {
        super(Gender::getCode, Gender::fromCode);
    }
}

