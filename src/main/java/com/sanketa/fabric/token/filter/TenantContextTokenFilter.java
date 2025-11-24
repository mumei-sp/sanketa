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
    
    /**
     * Main filter entry point.
     * Orchestrates the complete tenant context token validation and setup process.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        clearPreviousContext();
        
        if (shouldSkipTokenValidation(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = extractToken(request);
        if (!validateTokenPresence(token, request, response, filterChain)) {
            return;
        }
        
        try {
            TenantContext tenantContext = validateAndParseToken(token);
            attachTenantContextToRequest(request, tenantContext);

            if (!processActiveTenantHeader(request, response, tenantContext)) {
                return;
            }
            TenantCacheData tenantDetails = loadAndValidateTenantDetails(tenantContext, response);
            if (tenantDetails == null) {
                return;
            }
            
            establishRequestContext(tenantContext, tenantDetails);
            filterChain.doFilter(request, response);
        } catch (TokenValidationException e) {
            handleTokenValidationError(response, e);
        } catch (Exception e) {
            handleUnexpectedError(response, e);
        }
    }
    
    /**
     * Clears any existing context from previous request (handles thread pool reuse).
     */
    private void clearPreviousContext() {
        TenantContextStore.clearContext();
    }
    
    /**
     * Determines if the request path should skip token validation.
     * 
     * @param request The HTTP request
     * @return true if path is public and doesn't require token validation
     */
    private boolean shouldSkipTokenValidation(HttpServletRequest request) {
        return isPublicPath(request.getRequestURI());
    }
    
    /**
     * Validates that a token is present in the request.
     * 
     * @param token The extracted token (may be null or empty)
     * @param request The HTTP request
     * @param response The HTTP response
     * @param filterChain The filter chain
     * @return true if token validation should proceed, false if request was handled
     * @throws IOException if error response cannot be sent
     */
    private boolean validateTokenPresence(String token, HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        
        if (token == null || token.isEmpty()) {
            if (properties.isRequireToken()) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Missing Tenant Context Token");
                return false;
            } else {
                filterChain.doFilter(request, response);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Validates and parses the tenant context token.
     * 
     * @param token The token string to validate
     * @return Parsed TenantContext
     * @throws TokenValidationException if token is invalid
     */
    private TenantContext validateAndParseToken(String token) throws TokenValidationException {
        return tokenService.validateAndParseToken(token);
    }
    
    /**
     * Attaches the tenant context to the request as an attribute.
     * 
     * @param request The HTTP request
     * @param tenantContext The validated tenant context
     */
    private void attachTenantContextToRequest(HttpServletRequest request, TenantContext tenantContext) {
        request.setAttribute("tenantContext", tenantContext);
    }
    
    /**
     * Processes the X-Active-Tenant-Id header if present.
     * 
     * Validates that the user has access to the requested tenant and sets it as active.
     * 
     * @param request The HTTP request
     * @param response The HTTP response
     * @param tenantContext The tenant context
     * @return true if processing should continue, false if request was rejected
     * @throws IOException if error response cannot be sent
     */
    private boolean processActiveTenantHeader(HttpServletRequest request, HttpServletResponse response,
            TenantContext tenantContext) throws IOException {
        
        String activeTenantHeader = request.getHeader("X-Active-Tenant-Id");
        if (activeTenantHeader == null || activeTenantHeader.isEmpty()) {
            return true;
        }
        
        try {
            Long activeTenantId = parseActiveTenantId(activeTenantHeader);
            if (activeTenantId == null) {
                return true; // Invalid header, but continue with default tenant
            }

            if (!tenantContext.hasTenantAccess(activeTenantId)) {
                log.warn("User {} attempted to access unauthorized tenant {}", 
                        tenantContext.getUserId(), activeTenantId);
                sendErrorResponse(response, HttpStatus.FORBIDDEN,
                        "Access denied to tenant: " + activeTenantId);
                return false;
            }
            
            tenantContext.setActiveTenantId(activeTenantId);
            log.debug("Set active tenant ID to {} for user {}", activeTenantId, tenantContext.getUserId());
            return true;
        } catch (NumberFormatException e) {
            log.warn("Invalid X-Active-Tenant-Id header value: {}", activeTenantHeader);
            return true; // Continue with default tenant
        }
    }
    
    /**
     * Parses the active tenant ID from the header value.
     * 
     * @param headerValue The header value to parse
     * @return Parsed tenant ID, or null if invalid
     */
    private Long parseActiveTenantId(String headerValue) {
        try {
            return Long.parseLong(headerValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    /**
     * Loads and validates tenant details for database routing.
     * 
     * Ensures tenant details exist and have required configuration (connection string).
     * 
     * @param tenantContext The tenant context
     * @param response The HTTP response
     * @return TenantCacheData if valid, null if validation failed (error response sent)
     * @throws IOException if error response cannot be sent
     */
    private TenantCacheData loadAndValidateTenantDetails(TenantContext tenantContext,
            HttpServletResponse response) throws IOException {
        
        Long effectiveTenantId = tenantContext.getEffectiveTenantId();
        TenantCacheData tenantDetails = loadTenantDetails(effectiveTenantId);
        
        if (tenantDetails == null) {
            log.error("Failed to load tenant details for tenant ID: {}. Cannot proceed with DB routing.", 
                    effectiveTenantId);
            sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Tenant configuration not available. Please contact administrator.");
            return null;
        }
        
        if (!validateTenantConfiguration(tenantDetails, effectiveTenantId, response)) {
            return null;
        }
        
        checkTenantHealthStatus(tenantDetails, effectiveTenantId);
        return tenantDetails;
    }
    
    /**
     * Validates that tenant has required configuration for database routing.
     * 
     * @param tenantDetails The tenant cache data
     * @param tenantId The tenant ID
     * @param response The HTTP response
     * @return true if configuration is valid, false if validation failed (error response sent)
     * @throws IOException if error response cannot be sent
     */
    private boolean validateTenantConfiguration(TenantCacheData tenantDetails, Long tenantId,
            HttpServletResponse response) throws IOException {
        
        if (tenantDetails.getConnectionString() == null || tenantDetails.getConnectionString().isEmpty()) {
            log.error("Tenant {} has no connection string configured", tenantId);
            sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Tenant database configuration incomplete. Please contact administrator.");
            return false;
        }
        return true;
    }
    
    /**
     * Checks and logs tenant health status.
     * 
     * @param tenantDetails The tenant cache data
     * @param tenantId The tenant ID
     */
    private void checkTenantHealthStatus(TenantCacheData tenantDetails, Long tenantId) {
        if (tenantDetails.getIsHealthy() != null && !tenantDetails.getIsHealthy()) {
            log.warn("Tenant {} database instance is unhealthy", tenantId);
            // Note: We still proceed but log the warning - you may want to fail here instead
        }
    }
    
    /**
     * Establishes the request context with tenant information.
     * 
     * Creates an immutable RequestContext and stores it in TenantContextStore
     * for use by downstream filters and controllers.
     * 
     * @param tenantContext The validated tenant context
     * @param tenantDetails The loaded tenant details
     */
    private void establishRequestContext(TenantContext tenantContext, TenantCacheData tenantDetails) {
        RequestContext requestContext = RequestContext.builder()
                .tenantContext(tenantContext)
                .activeTenantDetails(tenantDetails)
                .build();
        TenantContextStore.setContext(requestContext);
        log.debug("Request context established for tenant ID: {}", tenantContext.getEffectiveTenantId());
    }
    
    /**
     * Handles token validation errors.
     * 
     * @param response The HTTP response
     * @param e The validation exception
     * @throws IOException if error response cannot be sent
     */
    private void handleTokenValidationError(HttpServletResponse response, TokenValidationException e) 
            throws IOException {
        log.warn("Token validation failed: {}", e.getMessage());
        sendErrorResponse(response, HttpStatus.UNAUTHORIZED,
                "Invalid Tenant Context Token: " + e.getMessage());
    }
    
    /**
     * Handles unexpected errors during token processing.
     * 
     * @param response The HTTP response
     * @param e The exception
     * @throws IOException if error response cannot be sent
     */
    private void handleUnexpectedError(HttpServletResponse response, Exception e) throws IOException {
        log.error("Unexpected error during token validation", e);
        sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR,
                "Token validation error");
    }
    
    /**
     * Extracts the tenant context token from the request header.
     * 
     * Supports both "Bearer <token>" format and plain token format.
     * 
     * @param request The HTTP request
     * @return The extracted token, or null if not present
     */
    private String extractToken(HttpServletRequest request) {
        String headerValue = request.getHeader(properties.getTokenHeaderName());
        if (headerValue != null && headerValue.startsWith("Bearer ")) {
            return headerValue.substring(7);
        }
        return headerValue;
    }
    
    /**
     * Checks if the request path is public and doesn't require token validation.
     * 
     * @param path The request URI path
     * @return true if path matches any public path pattern
     */
    private boolean isPublicPath(String path) {
        return Arrays.stream(properties.getPublicPaths())
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }
    
    /**
     * Loads tenant details from cache or database.
     * 
     * Attempts to load from cache first. On cache miss, attempts to load from database.
     * Returns null if tenant is not found in either location.
     * 
     * @param tenantId The tenant ID to load
     * @return TenantCacheData with DB connection info, or null if tenant not found
     */
    private TenantCacheData loadTenantDetails(Long tenantId) {
        if (tenantId == null) {
            log.debug("Cannot load tenant details: tenant ID is null");
            return null;
        }
        
        try {
            TenantCacheData cacheData = loadFromCache(tenantId);
            if (cacheData != null) {
                return cacheData;
            }
            
            return loadFromDatabase(tenantId);
            
        } catch (Exception e) {
            log.error("Error loading tenant details for tenant ID: {}", tenantId, e);
            return null;
        }
    }
    
    /**
     * Attempts to load tenant details from cache.
     * 
     * @param tenantId The tenant ID
     * @return TenantCacheData if found in cache, null otherwise
     */
    private TenantCacheData loadFromCache(Long tenantId) {
        TenantCacheData cacheData = tenantCacheService.getTenantById(tenantId);
        if (cacheData != null) {
            log.debug("Cache hit for tenant ID: {}", tenantId);
            return cacheData;
        }
        return null;
    }
    
    /**
     * Attempts to load tenant details from database on cache miss.
     * 
     * @param tenantId The tenant ID
     * @return TenantCacheData if found in database, null otherwise
     */
    private TenantCacheData loadFromDatabase(Long tenantId) {
        log.debug("Cache miss for tenant ID: {}, attempting to load from database", tenantId);
        
        TenantCacheData cacheData = tenantCacheService.getTenantById(tenantId, () -> {
            // TODO: Implement database loader to query v_user_tenant_resolution view
            log.warn("Database loader not implemented yet for tenant ID: {}. " +
                    "Tenant details must be pre-loaded into cache.", tenantId);
            return null;
        });
        
        if (cacheData == null) {
            log.warn("Tenant details not found in cache or database for tenant ID: {}", tenantId);
        }
        return cacheData;
    }
    
    /**
     * Sends an error response with JSON format.
     * 
     * @param response The HTTP response
     * @param status The HTTP status code
     * @param message The error message
     * @throws IOException if response cannot be written
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
