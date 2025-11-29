package com.sanketa.fabric.database.transaction;

import com.sanketa.fabric.database.validation.TenantContextValidator;
import com.sanketa.fabric.token.TenantContextStore;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * AOP interceptor that validates tenant context before transactional methods.
 * 
 * This interceptor runs before the transaction manager to ensure that
 * tenant context is available before any database operations begin.
 * 
 * @author mumei
 */
@Slf4j
@Aspect
@Component
@Order(1) // Run before transaction manager
public class TenantTransactionInterceptor {
    
    /**
     * Intercept methods annotated with @Transactional to validate tenant context.
     */
    @Around("@annotation(Transactional)")
    public Object validateTenantContext(ProceedingJoinPoint joinPoint) throws Throwable {

        validateTenantContext();
        if (log.isDebugEnabled()) {
            var context = TenantContextStore.getContext();
            if (context != null && context.getActiveTenantDetails() != null) {
                log.debug("Executing transactional method: {} for tenant: {}",
                    joinPoint.getSignature().toShortString(),
                    context.getActiveTenantDetails().getId());
            }
        }
        
        try {
            return joinPoint.proceed();
        } catch (Exception e) {
            if (log.isDebugEnabled()) {
                var context = TenantContextStore.getContext();
                if (context != null && context.getActiveTenantDetails() != null) {
                    log.debug("Transaction failed for tenant: {} in method: {}",
                        context.getActiveTenantDetails().getId(),
                        joinPoint.getSignature().toShortString());
                }
            }
            throw e;
        }
    }
    
    /**
     * Validate that tenant context is available and valid.
     */
    private void validateTenantContext() {
        TenantContextValidator.validateRequestContext();
    }
}
