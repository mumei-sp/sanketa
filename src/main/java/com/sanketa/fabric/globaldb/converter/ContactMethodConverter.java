package com.sanketa.fabric.globaldb.converter;

import com.sanketa.fabric.database.converter.AbstractEnumCodeConverter;
import com.sanketa.fabric.globaldb.model.enums.ContactMethod;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ContactMethod enum to TINYINT (Integer) database column.
 *
 * @author mumei
 */
@Converter(autoApply = false)
public class ContactMethodConverter extends AbstractEnumCodeConverter<ContactMethod> {
    
    public ContactMethodConverter() {
        super(ContactMethod::getCode, ContactMethod::fromCode);
    }
}
