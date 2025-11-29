package com.sanketa.fabric.database.transaction;

import com.sanketa.fabric.token.TenantContextStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.support.DefaultTransactionStatus;

import jakarta.persistence.EntityManagerFactory;

import java.util.Objects;

/**
 * Tenant-aware transaction manager that logs tenant context for transactions.
 * 
 * @author mumei
 */
@Slf4j
public class TenantTransactionManager extends JpaTransactionManager {
    
    public TenantTransactionManager() {
        super();
    }
    
    public TenantTransactionManager(EntityManagerFactory emf) {
        super(emf);
    }
    
    /**
     * Override to log tenant context when starting transaction.
     */
    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        super.doBegin(transaction, definition);
        
        if (log.isDebugEnabled()) {
            var context = TenantContextStore.getContext();
            if (!Objects.isNull(context) && !Objects.isNull(context.getActiveTenantDetails())) {
                var tenantData = context.getActiveTenantDetails();
                log.debug("Started transaction for tenant: {} (schema: {}, instance: {})",
                    tenantData.getId(),
                    tenantData.getTenantSchema(),
                    tenantData.getDatabaseInstanceName());
            }
        }
    }
    
    /**
     * Override to log transaction completion.
     */
    @Override
    protected void doCommit(DefaultTransactionStatus status) throws TransactionException {
        if (log.isDebugEnabled()) {
            var context = TenantContextStore.getContext();
            if (context != null && context.getActiveTenantDetails() != null) {
                log.debug("Committing transaction for tenant: {} (schema: {})",
                    context.getActiveTenantDetails().getId(),
                    context.getActiveTenantDetails().getTenantSchema());
            }
        }
        
        super.doCommit(status);
    }
    
    /**
     * Override to log transaction rollback.
     */
    @Override
    protected void doRollback(DefaultTransactionStatus status) throws TransactionException {
        if (log.isDebugEnabled() || log.isWarnEnabled()) {
            var context = TenantContextStore.getContext();
            if (context != null && context.getActiveTenantDetails() != null) {
                log.warn("Rolling back transaction for tenant: {} (schema: {})",
                    context.getActiveTenantDetails().getId(),
                    context.getActiveTenantDetails().getTenantSchema());
            } else {
                log.warn("Rolling back transaction (tenant context unavailable)");
            }
        }
        
        super.doRollback(status);
    }
}
