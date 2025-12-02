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

    /**
     * Sneaky throw utility to preserve checked exception types.
     */
    @SuppressWarnings("unchecked")
    private static <T extends Throwable> T sneakyThrow(Throwable throwable) throws T {
        throw (T) throwable;
    }

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

        try {
            return TenantContextStore.withScope(DatabaseScope.GLOBAL, () -> {
                try {
                    return pjp.proceed();
                } catch (RuntimeException | Error e) {
                    throw e;
                } catch (Throwable throwable) {
                    throw sneakyThrow(throwable);
                }
            });
        } catch (Throwable throwable) {
            // Re-throw the original exception (preserves type)
            throw throwable;
        }
    }
}
