package com.sanketa.fabric.vault.exception;

/**
 * Exception for Vault operations.
 * 
 * Wraps Spring Vault exceptions and provides application-specific error handling.
 * Spring Vault automatically handles retries, so this exception is primarily
 * for application-level error reporting.
 */
public class VaultException extends RuntimeException {
    
    public VaultException(String message) {
        super(message);
    }
    
    public VaultException(String message, Throwable cause) {
        super(message, cause);
    }
}
