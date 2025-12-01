package com.sanketa.fabric.globaldb.repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Utility for consistent JDBC {@link Timestamp} / {@link Date}
 * to Java time conversions for the Global DB.
 */
final class GlobalDbJdbcUtils {

    private GlobalDbJdbcUtils() {
        // utility class
    }

    static OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }
        return timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    static LocalDate toLocalDate(Date date) {
        if (date == null) {
            return null;
        }
        return date.toLocalDate();
    }
}
