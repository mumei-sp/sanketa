package com.sanketa.fabric.database.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

/**
 * Base repository interface for tenant-aware repositories.
 *
 * All repositories that work with tenant databases should extend this interface.
 * The tenant context is automatically resolved from ThreadLocal by
 * the TenantRoutingDataSource, so repositories don't need to explicitly
 * handle tenant routing.
 * 
 * @param <T> Entity type
 * @param <ID> ID type
 * 
 * @author mumei
 */
@NoRepositoryBean
public interface TenantAwareRepository<T, ID> extends JpaRepository<T, ID> {
    
    /**
     * Example: Custom query methods can be added here that are
     * automatically scoped to the current tenant's database/schema.
     * 
     * All standard JpaRepository methods (save, findById, findAll, etc.)
     * will automatically use the tenant's database based on RequestContext.
     */
}
