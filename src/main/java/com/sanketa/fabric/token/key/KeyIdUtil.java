package com.sanketa.fabric.token.key;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Key ID Utility
 * Key ID Format: "key-YYYYMMDD" (date-based format)
 * 
 * @author mumei
 */
@Slf4j
@Component
public class KeyIdUtil {
    
    /**
     * Key ID prefix
     */
    private static final String KEY_PREFIX = "key-";
    
    /**
     * Date format for key IDs: YYYYMMDD
     */
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    /**
     * Pattern to match key IDs: key-YYYYMMDD
     */
    private static final Pattern KEY_ID_PATTERN = Pattern.compile("^key-\\d{8}$");
    
    /**
     * Generate a new key ID based on current date
     */
    public String generateKeyId() {
        return generateKeyId(LocalDate.now());
    }
    
    /**
     * Generate a key ID for a specific date
     */
    public String generateKeyId(LocalDate date) {
        String dateStr = date.format(DATE_FORMAT);
        return KEY_PREFIX + dateStr;
    }
    
    /**
     * Validates key ID format.
     * 
     * @param keyId The key ID to validate
     * @return true if key ID is valid, false otherwise
     */
    public boolean isValidKeyId(String keyId) {
        if (isNullOrEmpty(keyId)) {
            return false;
        }
        
        return matchesKeyIdPattern(keyId);
    }
    
    /**
     * Extracts date from key ID.
     * 
     * @param keyId The key ID to extract date from
     * @return The extracted date, or null if key ID is invalid
     */
    public LocalDate extractDateFromKeyId(String keyId) {
        if (isNullOrEmpty(keyId)) {
            return null;
        }
        
        return parseDateFromKeyId(keyId);
    }
    
    /**
     * Finds the latest key ID from a list of key IDs.
     * 
     * Compares key IDs by date extracted from key ID format (key-YYYYMMDD).
     * 
     * @param keyIds List of key IDs to search
     * @return Latest key ID, or null if list is empty or no valid keys found
     */
    public String findLatestKeyId(List<String> keyIds) {
        if (isNullOrEmpty(keyIds)) {
            return null;
        }
        
        List<String> validKeyIds = filterValidKeyIds(keyIds);
        if (validKeyIds.isEmpty()) {
            return null;
        }
        
        String latest = findLatestKeyIdByDate(validKeyIds);
        log.debug("Found latest key ID: {} from list: {}", latest, keyIds);
        return latest;
    }
    
    /**
     * Checks if a string is null or empty (after trimming).
     * 
     * @param value The string to check
     * @return true if null or empty
     */
    private boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
    
    /**
     * Checks if a list is null or empty.
     * 
     * @param list The list to check
     * @return true if null or empty
     */
    private boolean isNullOrEmpty(List<?> list) {
        return list == null || list.isEmpty();
    }
    
    /**
     * Checks if a key ID matches the expected pattern (key-YYYYMMDD).
     * 
     * @param keyId The key ID to check
     * @return true if it matches the pattern
     */
    private boolean matchesKeyIdPattern(String keyId) {
        return KEY_ID_PATTERN.matcher(keyId).matches();
    }
    
    /**
     * Parses the date portion from a key ID.
     * 
     * @param keyId The key ID to parse
     * @return The parsed date, or null if parsing fails
     */
    private LocalDate parseDateFromKeyId(String keyId) {
        try {
            if (!keyId.startsWith(KEY_PREFIX)) {
                return null;
            }
            
            String dateStr = extractDateString(keyId);
            if (isValidDateString(dateStr)) {
                return LocalDate.parse(dateStr, DATE_FORMAT);
            }
        } catch (Exception e) {
            log.debug("Failed to extract date from keyId: {}", keyId, e);
        }
        
        return null;
    }
    
    /**
     * Extracts the date string portion from a key ID.
     * 
     * @param keyId The key ID
     * @return The date string (YYYYMMDD format)
     */
    private String extractDateString(String keyId) {
        return keyId.substring(KEY_PREFIX.length());
    }
    
    /**
     * Checks if a date string has the correct length (8 characters for YYYYMMDD).
     * 
     * @param dateStr The date string to check
     * @return true if length is 8
     */
    private boolean isValidDateString(String dateStr) {
        return dateStr != null && dateStr.length() == 8;
    }
    
    /**
     * Filters and validates key IDs from a list.
     * 
     * @param keyIds The list of key IDs to filter
     * @return List of valid key IDs
     */
    private List<String> filterValidKeyIds(List<String> keyIds) {
        return keyIds.stream()
                .filter(id -> !isNullOrEmpty(id))
                .filter(this::isValidKeyId)
                .collect(Collectors.toList());
    }
    
    /**
     * Finds the latest key ID by comparing dates extracted from key IDs.
     * 
     * @param validKeyIds List of valid key IDs
     * @return The latest key ID, or null if none found
     */
    private String findLatestKeyIdByDate(List<String> validKeyIds) {
        return validKeyIds.stream()
                .max(createKeyIdDateComparator())
                .orElse(null);
    }
    
    /**
     * Creates a comparator for key IDs based on extracted dates.
     * 
     * @return Comparator that compares key IDs by date
     */
    private Comparator<String> createKeyIdDateComparator() {
        return Comparator
                .comparing((String id) -> extractDateFromKeyId(id), 
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Comparator.naturalOrder());
    }
}
