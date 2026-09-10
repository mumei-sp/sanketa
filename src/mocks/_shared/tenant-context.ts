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

import { authUtils } from '@/api/utils/auth'

/**
 * The school a call is against when nothing has said otherwise.
 *
 * `TenantContext.getEffectiveTenantId()` falls back to the first tenant in the
 * token when a request sends no `X-Active-Tenant-Id`; this is the same
 * behaviour for the same reason — most people belong to exactly one school and
 * should never have to say which.
 */
const DEFAULT_TENANT = 'kendriya'

/**
 * Where the client remembers which school it is sending.
 *
 * `X-Active-Tenant-Id` is a header the client puts on every request, so the
 * client is what has to remember it across a reload — the same way it
 * remembers the token it sends alongside. Kept out of the session object
 * because it is a choice the person makes and unmakes, not something the
 * server issued.
 */
const ACTIVE_KEY = 'sanketa:active-tenant'

let active: string | null = null

/**
 * Which school to serve, correcting a preference the session cannot hold.
 *
 * ── Why the check is here and not only in the adapter ─────────────────
 * `applyTenantContext` already corrects a stale `X-Active-Tenant-Id` — but it
 * runs per request, and several fixtures are module constants resolved at
 * import: the faculty, the timetables, the fee ledger, the mark sheets, the
 * registers, the bus lists. Those evaluate before the first request, so a
 * stored preference naming a school the account does not hold was served to
 * them and corrected afterwards, for everybody else.
 *
 * It showed as a dashboard reading 441 enrolled students — Kendriya's roster,
 * loaded lazily after the correction — above 33 active teachers, which is
 * Vidya Mandir's staff room, read eagerly before it. Two schools on one
 * screen, which is the one thing the boundary exists to prevent.
 *
 * So the correction happens at the first read of all, which is here. This is
 * not an authorisation check standing in for the token's — the token's 403 is
 * still the thing that refuses a switch. It is the client declining to act on
 * its own remembered choice when the session it now has cannot honour it,
 * which is what `applyTenantContext` does one layer up.
 */
function current(): string {
  if (active !== null) return active

  let stored: string | null = null
  try {
    stored = localStorage.getItem(ACTIVE_KEY)
  } catch {
    // Unavailable in private mode; the fallbacks below serve this session.
  }

  // No session yet — the login screen, or a signed-out tab. Nothing to check
  // the preference against, so answer and *do not* remember the answer.
  //
  // Memoising here was the sharper edge of the same bug. Sign-in is a
  // client-side navigation, so a read before it — the login screen renders,
  // something touches a store — pinned the module to the default school for
  // the life of the page. An account holding only Vidya Mandir would then
  // have every eagerly-resolved fixture built from Kendriya, and nothing
  // afterwards could rebuild a `const`.
  const held = authUtils.getUser()?.tenantCodes
  if (!held || held.length === 0) {
    return stored || DEFAULT_TENANT
  }

  // `tenantIds[0]` is what the backend falls back to when a request names no
  // school, so a corrected preference lands on the same school there as here.
  if (stored !== null && held.includes(stored)) {
    active = stored
    return active
  }

  active = held[0]
  // Written back, not merely overridden in memory. A stored preference that is
  // never honoured is a lie in devtools — the one place somebody goes to check
  // whether the boundary is holding — and it would make every load pay the
  // correction again.
  try {
    localStorage.setItem(ACTIVE_KEY, active)
  } catch {
    // Private mode; the correction still holds for this session.
  }
  return active
}

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

/** The active school's code — `kendriya`, `vidya-mandir`. */
export function activeTenant(): string {
  return current()
}

/**
 * The `localStorage` key for one of the active school's tables.
 *
 * Shaped `sanketa:mock-db:<tenant>:<table>` so a school's rows are visibly its
 * own when you look in devtools, which is the same reason schemas are named.
 */
export function tenantKey(table: string): string {
  return `sanketa:mock-db:${current()}:${table}`
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
  if (tenantCode === current()) return
  active = tenantCode
  try {
    localStorage.setItem(ACTIVE_KEY, tenantCode)
  } catch {
    // Private mode; the switch still holds for this session.
  }
  forgetters.forEach(forget => forget())
}

/** Back to the default school. Used when a session ends. */
export function resetTenantContext(): void {
  setActiveTenant(DEFAULT_TENANT)
  try {
    localStorage.removeItem(ACTIVE_KEY)
  } catch {
    // Nothing to forget.
  }
}
