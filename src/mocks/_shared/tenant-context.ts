/**
 * Which school the current call is against.
 *
 * The backend runs schema-per-tenant: one global database holding identity, and
 * a separate schema per school holding that school's people and records.
 * Hibernate picks the schema per request from `X-Active-Tenant-Id`, checked
 * against the tenant ids in the caller's context token.
 *
 * This is that, in a browser. A per-tenant store keys its `localStorage` by the
 * active tenant, so two schools are two disjoint row sets rather than one set
 * with a `tenant_id` column — which is what schema-per-tenant *is*, and it
 * means a query cannot accidentally span schools. There is no filter to forget.
 *
 * ── Global vs per-tenant ───────────────────────────────────────────────
 * `users`, `tenants`, `user_tenant_mapping` and sessions are global: one
 * person's login is one row however many schools they belong to. Everything
 * about a school — its people, roles, classes, marks, fees — is per-tenant.
 * A store declares which it is by the key it asks for.
 */

/**
 * The school a call is against when nothing has said otherwise.
 *
 * `TenantContext.getEffectiveTenantId()` falls back to the first tenant in the
 * token when a request sends no `X-Active-Tenant-Id`; this is the same
 * behaviour for the same reason — most people belong to exactly one school and
 * should never have to say which.
 */
const DEFAULT_TENANT = 'greenwood'

let active = DEFAULT_TENANT

/**
 * Stores that must forget their cached rows when the school changes.
 *
 * A store caches its parsed database in a module variable, which is right —
 * it stands in for a connection. On a switch that cache is another school's
 * data, so it has to be dropped rather than merely re-keyed. Registering here
 * rather than having the switcher know every store means adding a table cannot
 * forget to do it.
 */
const forgetters = new Set<() => void>()

/** The active school's code — `greenwood`, `riverside`. */
export function activeTenant(): string {
  return active
}

/**
 * The `localStorage` key for one of the active school's tables.
 *
 * Shaped `sanketa:mock-db:<tenant>:<table>` so a school's rows are visibly its
 * own when you look in devtools, which is the same reason schemas are named.
 */
export function tenantKey(table: string): string {
  return `sanketa:mock-db:${active}:${table}`
}

/** The key for a table that belongs to no school. */
export function globalKey(table: string): string {
  return `sanketa:mock-db:global:${table}`
}

/** Called by a per-tenant store at module load. */
export function onTenantSwitch(forget: () => void): void {
  forgetters.add(forget)
}

/**
 * Point subsequent calls at another school.
 *
 * Does not check whether the caller may reach it — that is the context token's
 * job, and doing it here would put the guard below the thing it guards. See
 * `assertTenantAccess` in the token mock.
 */
export function setActiveTenant(tenantCode: string): void {
  if (tenantCode === active) return
  active = tenantCode
  forgetters.forEach(forget => forget())
}

/** Back to the default school. Used when a session ends. */
export function resetTenantContext(): void {
  setActiveTenant(DEFAULT_TENANT)
}
