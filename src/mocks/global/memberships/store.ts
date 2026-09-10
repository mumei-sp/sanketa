/**
 * Who belongs to which school — fabric's `user_tenant_mapping`.
 *
 * The table the whole multi-school model turns on. One login is one row in
 * `users` however many schools the person belongs to; this says which, and a
 * parent with children at two schools is two rows here rather than two
 * accounts. `UNIQUE(user_id, tenant_id)` is what makes a second school's
 * attempt to enrol an existing parent a no-op rather than a duplicate.
 *
 * ── What is deliberately *not* here ────────────────────────────────────
 * No role, no profile type, no class assignment. Those describe what a person
 * is at a school, and a school's roles are a school's own data — putting their
 * ids in the global database would be exactly the cross-database domain
 * reference `Multi-Tenant-LMS__ARCH.md` forbids. They live in the tenant
 * schema, keyed on the profile. See SCHEMA.md.
 *
 * This row says only: this person is at this school, and the relationship is
 * live. `isActive` is worth having on its own — one school can revoke someone
 * without touching what they hold anywhere else.
 */

import { newId } from '@/mocks/_shared'
import { globalKey } from '@/mocks/_shared/tenant-context'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { findTenant } from '@/mocks/global/tenants/store'
import type { Tenant } from '@/mocks/global/tenants/store'

export interface Membership {
  id: string
  userId: string
  /** `tenants.tenant_code`. */
  tenantCode: string
  /** `user_tenant_mapping.is_active`. */
  isActive: boolean
}

const TABLE = 'memberships'

interface Database {
  rows: Membership[]
  /** Which seed these rows came from — see `seedSignature`. */
  seed?: string
}

let db: Database | null = null

/**
 * Who starts out where.
 *
 * The four staff logins belong to Kendriya Vidyalaya. Rohan Sharma belongs to
 * both, which is the case the table exists for: a parent with a child at each
 * school is *two rows here and one account*, not two accounts. Everything
 * about multi-school — the switcher, the context token's `tenantIds`, its
 * 403 on a school you do not hold, `applyTenantContext`'s correction of a
 * stale preference — was unexercised until one row said this, because no
 * seeded login held more than one school.
 *
 * `UNIQUE(user_id, tenant_id)` in the real table is what makes a second
 * school's attempt to enrol an existing parent a no-op rather than a
 * duplicate; `addMembership` is idempotent on the pair for the same reason.
 */
const SEED_ROWS: Membership[] = [
  { id: 'UTM-1', userId: '1', tenantCode: 'kendriya', isActive: true },
  { id: 'UTM-2', userId: '2', tenantCode: 'kendriya', isActive: true },
  { id: 'UTM-3', userId: '3', tenantCode: 'kendriya', isActive: true },
  { id: 'UTM-4', userId: '4', tenantCode: 'kendriya', isActive: true },
  { id: 'UTM-5', userId: '5', tenantCode: 'kendriya', isActive: true },
  { id: 'UTM-6', userId: '5', tenantCode: 'vidya-mandir', isActive: true },
]

function seed(): Database {
  return { rows: SEED_ROWS.map(row => ({ ...row })), seed: seedSignature(SEED_ROWS) }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(globalKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      // Reseeded rather than migrated when the seed changes, so adding a
      // membership to the seed is visible on a browser that has run the app
      // before. See `seedSignature`.
      if (Array.isArray(parsed.rows) && parsed.seed === seedSignature(SEED_ROWS)) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }
  db = seed()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(globalKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

const clone = (row: Membership): Membership => ({ ...row })

// ── Reads ─────────────────────────────────────────────────────────────

export function listMemberships(): Membership[] {
  return load().rows.map(clone)
}

/**
 * Every school this login can be routed to.
 *
 * The mock's `v_user_tenant_resolution`. That view's `WHERE` clause requires
 * the user, the mapping *and* the tenant all active, so this does too — a
 * suspended school must not resolve, or a token would authorise a schema
 * nobody is meant to reach.
 *
 * Returns a list, like `findTenantResolutionsByKeycloakUserId` does. The
 * plural is the point: one login, many schools.
 */
export function resolveTenants(userId: string): Tenant[] {
  return load()
    .rows.filter(row => row.userId === userId && row.isActive)
    .flatMap(row => {
      const tenant = findTenant(row.tenantCode)
      return tenant && tenant.isActive ? [tenant] : []
    })
}

/** Everyone at one school, for its own People screen. */
export function membersOf(tenantCode: string): Membership[] {
  return load()
    .rows.filter(row => row.tenantCode === tenantCode)
    .map(clone)
}

export function findMembership(userId: string, tenantCode: string): Membership | undefined {
  const found = load().rows.find(
    row => row.userId === userId && row.tenantCode === tenantCode,
  )
  return found ? clone(found) : undefined
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * Put a person at a school. Idempotent on the pair.
 *
 * The schema has `UNIQUE(user_id, tenant_id)`, so a second school enrolling
 * someone who already has an account is this call and nothing else — no new
 * login, no second person. Re-enrolling somebody previously revoked
 * reactivates the row they already had rather than adding another.
 */
export function addMembership(input: { userId: string; tenantCode: string }): Membership | null {
  const database = load()
  const tenant = findTenant(input.tenantCode)
  if (!tenant) return null

  const existing = database.rows.find(
    row => row.userId === input.userId && row.tenantCode === input.tenantCode,
  )
  if (existing) {
    existing.isActive = true
    persist()
    return clone(existing)
  }

  const row: Membership = {
    id: newId('UTM'),
    userId: input.userId,
    tenantCode: input.tenantCode,
    isActive: true,
  }
  database.rows.push(row)
  persist()
  return clone(row)
}

/**
 * Revoke or restore one school's access without touching the login.
 *
 * Deactivating rather than deleting, because the person may hold records in
 * that school's schema that outlive their access to it — a teacher who leaves
 * still marked the attendance they marked.
 */
export function setMembershipActive(
  userId: string,
  tenantCode: string,
  isActive: boolean,
): Membership | null {
  const database = load()
  const row = database.rows.find(
    candidate => candidate.userId === userId && candidate.tenantCode === tenantCode,
  )
  if (!row) return null
  row.isActive = isActive
  persist()
  return clone(row)
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetMemberships(): void {
  db = seed()
  persist()
}
