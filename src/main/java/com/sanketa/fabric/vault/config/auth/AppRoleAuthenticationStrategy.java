package com.sanketa.fabric.vault.config.auth;

import com.sanketa.fabric.vault.config.VaultProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.vault.authentication.AppRoleAuthentication;
import org.springframework.vault.authentication.AppRoleAuthenticationOptions;
import org.springframework.vault.authentication.ClientAuthentication;
import org.springframework.web.client.RestOperations;

import java.util.Objects;

/**
 * AppRole-based authentication strategy for Vault.
 * 
 * @author mumei
 */
@Slf4j
@RequiredArgsConstructor
public class AppRoleAuthenticationStrategy implements VaultAuthenticationStrategy {
    
    private final VaultProperties.Auth auth;
    
    @Override
    public ClientAuthentication createAuthentication(RestOperations restOperations) {
        if (Objects.isNull(restOperations)) {
            throw new IllegalStateException("RestOperations is required for AppRole authentication");
        }
        
        VaultProperties.AppRoleAuth approle = auth.getApprole();
        if (Objects.isNull(approle)) {
            throw new IllegalStateException("AppRole authentication configuration is missing");
        }
        
        String roleId = approle.getRoleId();
        String secretId = approle.getSecretId();
        String mountPath = approle.getMountPath();
        
        if (Objects.isNull(roleId) || roleId.isEmpty()) {
            roleId = System.getenv("VAULT_ROLE_ID");
        }
        if (Objects.isNull(secretId) || secretId.isEmpty()) {
            secretId = System.getenv("VAULT_SECRET_ID");
        }
        
        if (Objects.isNull(roleId) || roleId.isEmpty() || Objects.isNull(secretId) || secretId.isEmpty()) {
            throw new IllegalStateException(
                "AppRole credentials not configured. Set fabric.vault.auth.approle.role-id/secret-id " +
                "or VAULT_ROLE_ID/VAULT_SECRET_ID environment variables");
        }
        
        if (Objects.isNull(mountPath) || mountPath.isEmpty()) {
            mountPath = "approle";
        }
        
        log.debug("Using AppRole authentication with mount path: {}", mountPath);
        
        AppRoleAuthenticationOptions options = AppRoleAuthenticationOptions.builder()
            .roleId(AppRoleAuthenticationOptions.RoleId.provided(roleId))
            .secretId(AppRoleAuthenticationOptions.SecretId.provided(secretId))
            .path(mountPath)
            .build();
        return new AppRoleAuthentication(options, restOperations);
    }
    
    @Override
    public String getMethodName() {
        return "approle";
    }
}
