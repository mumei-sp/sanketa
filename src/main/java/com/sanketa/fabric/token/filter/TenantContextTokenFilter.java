package com.sanketa.fabric.token.filter;

import com.sanketa.fabric.cache.model.TenantCacheData;
import com.sanketa.fabric.cache.tenant.TenantCacheService;
import com.sanketa.fabric.token.TenantContextTokenProperties;
import com.sanketa.fabric.token.TenantContextTokenService;
import com.sanketa.fabric.token.exception.TokenValidationException;
import com.sanketa.fabric.token.model.RequestContext;
import com.sanketa.fabric.token.model.TenantContext;
import com.sanketa.fabric.token.TenantContextStore;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

/**
 * Tenant Context Token Validation Filter
 * 
 * This filter validates the PASETO TCT token on every request.
 * It runs after Keycloak token validation.
 * 
 * @author mumei
 */
@Slf4j
@Component
@Order(2) // Run after Keycloak filter (order 1)
@RequiredArgsConstructor
public class TenantContextTokenFilter extends OncePerRequestFilter {
    
    private final TenantContextTokenService tokenService;
    private final TenantContextTokenProperties properties;
    private final TenantCacheService tenantCacheService;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // Clear any existing context from previous request (thread pool reuse)
        TenantContextStore.clearContext();
        
        if (isPublicPath(request.getRequestURI())) {    // doesn't require token
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = extractToken(request);
        if (token == null || token.isEmpty()) {
            if (properties.isRequireToken()) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Missing Tenant Context Token");
                return;
            } else {
                filterChain.doFilter(request, response);
                return;
            }
        }
        
        try {
            // Validate and parse token
            TenantContext context = tokenService.validateAndParseToken(token);
            request.setAttribute("tenantContext", context);
            
            // Handle active tenant header
            String activeTenantHeader = request.getHeader("X-Active-Tenant-Id");
            if (activeTenantHeader != null && !activeTenantHeader.isEmpty()) {
                try {
                    Long activeTenantId = Long.parseLong(activeTenantHeader);
                    if (context.hasTenantAccess(activeTenantId)) {
                        context.setActiveTenantId(activeTenantId);
                    } else {
                        log.warn("User {} attempted to access unauthorized tenant {}", 
                                context.getUserId(), activeTenantId);
                        sendErrorResponse(response, HttpStatus.FORBIDDEN,
                                "Access denied to tenant: " + activeTenantId);
                        return;
                    }
                } catch (NumberFormatException e) {
                    log.warn("Invalid X-Active-Tenant-Id header value: {}", activeTenantHeader);
                }
            }
            
            // Get effective tenant ID (active tenant if set, otherwise first tenant)
            Long effectiveTenantId = context.getEffectiveTenantId();
            TenantCacheData activeTenantDetails = loadTenantDetails(effectiveTenantId);
            
            if (activeTenantDetails == null) {
                log.error("Failed to load tenant details for tenant ID: {}. Cannot proceed with DB routing.", 
                        effectiveTenantId);
                sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tenant configuration not available. Please contact administrator.");
                return;
            }
            
            // Validate critical fields for DB routing
            if (activeTenantDetails.getConnectionString() == null || activeTenantDetails.getConnectionString().isEmpty()) {
                log.error("Tenant {} has no connection string configured", effectiveTenantId);
                sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tenant database configuration incomplete. Please contact administrator.");
                return;
            }
            if (activeTenantDetails.getIsHealthy() != null && !activeTenantDetails.getIsHealthy()) {
                log.warn("Tenant {} database instance is unhealthy", effectiveTenantId);
                // Note: We still proceed but log the warning - you may want to fail here instead
            }
            
            // RequestContext is immutable (@Value) - cannot be modified after creation
            RequestContext requestContext = RequestContext.builder()
                    .tenantContext(context)
                    .activeTenantDetails(activeTenantDetails)
                    .build();
            TenantContextStore.setContext(requestContext);
            
            // Continue filter chain - context is available to all downstream filters and controllers
            filterChain.doFilter(request, response);
            // Note: Context will be cleared by TenantContextCleanupFilter after request completes
        } catch (TokenValidationException e) {
            log.warn("Token validation failed: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED,
                    "Invalid Tenant Context Token: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during token validation", e);
            sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Token validation error");
        }
    }
    
    /**
     * Extract token from request header
     */
    private String extractToken(HttpServletRequest request) {
        String headerValue = request.getHeader(properties.getTokenHeaderName());
        if (headerValue != null && headerValue.startsWith("Bearer ")) {
            return headerValue.substring(7);
        }
        return headerValue;
    }
    
    /**
     * Check if path is public (doesn't require token)
     */
    private boolean isPublicPath(String path) {
        return Arrays.stream(properties.getPublicPaths())
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }
    
    /**
     * Load tenant details from cache or database
     * 
     * @param tenantId Tenant ID to load
     * @return TenantCacheData with DB connection info, or null if tenant not found
     */
    private TenantCacheData loadTenantDetails(Long tenantId) {
        if (tenantId == null) {
            log.debug("Cannot load tenant details: tenant ID is null");
            return null;
        }
        
        try {
            TenantCacheData cacheData = tenantCacheService.getTenantById(tenantId);
            
            if (cacheData != null) {
                log.debug("Cache hit for tenant ID: {}", tenantId);
                return cacheData;
            }
            
            log.debug("Cache miss for tenant ID: {}, attempting to load from database", tenantId);
            
            cacheData = tenantCacheService.getTenantById(tenantId, () -> {
                // TODO: Implement database loader to query v_user_tenant_resolution view
                log.warn("Database loader not implemented yet for tenant ID: {}. " +
                        "Tenant details must be pre-loaded into cache.", tenantId);
                return null;
            });
            
            if (cacheData == null) {
                log.warn("Tenant details not found in cache or database for tenant ID: {}", tenantId);
                return null;
            }
            return cacheData;
            
        } catch (Exception e) {
            log.error("Error loading tenant details for tenant ID: {}", tenantId, e);
            return null;
        }
    }
    
    /**
     * Send error response
     */
    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) 
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"error\":\"%s\",\"message\":\"%s\",\"status\":%d}",
                status.getReasonPhrase(), message, status.value()));
    }
}
