package com.sanketa.fabric.database.converter;

import jakarta.persistence.AttributeConverter;

import java.util.Objects;
import java.util.function.Function;

/**
 * Abstract base converter for enums with integer codes.
 * 
 * This is a general utility converter that can be used for any enum
 * that has a getCode() method and a fromCode() or fromCodeOrThrow() static method.
 * 
 * @param <E> The enum type that has a getCode() method and fromCode()/fromCodeOrThrow() static method
 * @author mumei
 */
public abstract class AbstractEnumCodeConverter<E extends Enum<E>> implements AttributeConverter<E, Integer> {
    
    private final Function<E, Integer> toCodeFunction;
    private final Function<Integer, E> fromCodeFunction;
    
    protected AbstractEnumCodeConverter(Function<E, Integer> toCodeFunction, Function<Integer, E> fromCodeFunction) {
        this.toCodeFunction = toCodeFunction;
        this.fromCodeFunction = fromCodeFunction;
    }
    
    @Override
    public Integer convertToDatabaseColumn(E attribute) {
        if (Objects.isNull(attribute)) {
            return null;
        }
        return toCodeFunction.apply(attribute);
    }
    
    @Override
    public E convertToEntityAttribute(Integer dbData) {
        if (Objects.isNull(dbData)) {
            return null;
        }
        return fromCodeFunction.apply(dbData);
    }
}
