package com.sanketa.fabric.globaldb;

import com.sanketa.fabric.token.TenantContextStore;
import com.sanketa.fabric.token.model.DatabaseScope;
import com.sanketa.fabric.token.model.RequestContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * AOP interceptor for {@link UseGlobalDb} annotated methods.
 *
 * Responsibilities:
 * - Temporarily set {@code dbScope = GLOBAL} in {@link RequestContext}
 *   for logging/traceability while the annotated method executes.
 * - Provide a single, centralized hook where we can later add optional
 *   guardrails to detect accidental tenant DB usage.
 *
 * IMPORTANT:
 * - This interceptor does NOT change DataSource routing.
 *   Global DB access must still go through the dedicated Global DB
 *   infrastructure (e.g., globalJdbcTemplate-backed services).
 */
@Slf4j
@Aspect
@Component
@Order(2) // Run after tenant context validation, before most business logic
public class UseGlobalDbInterceptor {

    @Around("@annotation(com.sanketa.fabric.globaldb.UseGlobalDb) || @within(com.sanketa.fabric.globaldb.UseGlobalDb)")
    public Object applyGlobalDbScope(ProceedingJoinPoint pjp) throws Throwable {
        if (!TenantContextStore.hasContext()) {
            // In flows without a RequestContext (e.g. background jobs), just proceed.
            return pjp.proceed();
        }

        var signature = pjp.getSignature().toShortString();
        if (log.isDebugEnabled()) {
            log.debug("Entering @UseGlobalDb method with GLOBAL dbScope: {}", signature);
        }

        return TenantContextStore.withScope(DatabaseScope.GLOBAL, () -> {
            try {
                return pjp.proceed();
            } catch (Throwable throwable) {
                // Sneaky rethrow via runtime wrapper to satisfy Supplier<T> signature
                if (throwable instanceof RuntimeException runtimeException) {
                    throw runtimeException;
                }
                throw new RuntimeException(throwable);
            }
        });
    }
}
