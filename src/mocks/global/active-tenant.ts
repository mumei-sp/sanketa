/**
 * The active school's `tenant_code`.
 *
 * `tenant-context` keys storage by the *schema*, because that is what the
 * backend switches Hibernate to. Memberships key on the *code*, because that
 * is what the token carries and what routing resolves. They are the same
 * string in the seed and nothing guarantees it stays that way — fabric keeps
 * them in two different tables — so the translation happens here rather than
 * being assumed at each call site.
 */

import { activeTenant } from '@/mocks/_shared/tenant-context'
import { listTenants } from './tenants/store'

export function activeTenantCode(): string {
  const schema = activeTenant()
  return listTenants().find(tenant => tenant.schema === schema)?.code ?? schema
}
