package com.sanketa.user.converter;

import com.sanketa.user.domain.enums.ContactMethod;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ContactMethod enum to TINYINT (Integer) database column.
 * 
 * @author mumei
 */
@Converter(autoApply = false)
public class ContactMethodConverter extends AbstractEnumCodeConverter<ContactMethod> {
    
    public ContactMethodConverter() {
        super(ContactMethod::getCode, ContactMethod::fromCodeOrThrow);
    }
}

