package com.sanketa.fabric.globaldb;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark service methods that operate exclusively on the Global DB.
 *
 * Semantics:
 * - Signals that the method should use only Global DB access paths
 *   (e.g., services/repositories backed by {@code globalJdbcTemplate}).
 * - Can be used by AOP interceptors for:
 *   - Setting {@code dbScope = GLOBAL} in the {@link com.sanketa.fabric.token.model.RequestContext}
 *     for logging and tracing.
 *   - Optional guardrails to detect accidental tenant DB usage.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface UseGlobalDb {
}
