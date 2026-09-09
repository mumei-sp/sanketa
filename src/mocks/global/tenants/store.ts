/**
 * The schools. Global, because a school exists before anyone belongs to it.
 *
 * Fabric's `tenants` table holds only what routing needs — a code, a name, an
 * active flag — and says so: *"All detailed school information (address,
 * configuration, etc.) is stored in Tenant DBs."* So this is deliberately
 * thin; the school's own name, logo and term dates live in its schema, not
 * here.
 *
 * ── Three identifiers, and why this has two ────────────────────────────
 * Fabric splits them: `tenants.id` is a numeric primary key,
 * `tenants.tenant_code` is the routing identifier, and
 * `tenant_database_mapping.tenant_schema` is the schema Hibernate switches to.
 * Here `code` does the first two jobs and `schema` the third, kept separate
 * because they are separate in the target and a mock that collapses them
 * teaches the wrong shape.
 */

import { globalKey } from '@/mocks/_shared/tenant-context'

export interface Tenant {
  /** `tenants.tenant_code`. Also the mock's primary key. */
  code: string
  /** `tenants.name` — for logging and the school switcher, nothing else. */
  name: string
  /**
   * `tenant_database_mapping.tenant_schema`.
   *
   * What the backend switches Hibernate to, and what this mock prefixes its
   * storage keys with. Usually the same string as `code`; separate because
   * nothing guarantees it and the backend routes on this one.
   */
  schema: string
  /** `tenants.is_active`. A suspended school resolves for nobody. */
  isActive: boolean
}

const TABLE = 'tenants'

interface Database {
  rows: Tenant[]
}

let db: Database | null = null

function seed(): Database {
  return {
    rows: [
      {
        code: 'greenwood',
        name: 'Greenwood International School',
        schema: 'greenwood',
        isActive: true,
      },
      {
        code: 'riverside',
        name: 'Riverside Public School',
        schema: 'riverside',
        isActive: true,
      },
    ],
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(globalKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
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

const clone = (tenant: Tenant): Tenant => ({ ...tenant })

export function listTenants(): Tenant[] {
  return load().rows.map(clone)
}

/** Only the ones a person could actually be routed to. */
export function listActiveTenants(): Tenant[] {
  return load().rows.filter(tenant => tenant.isActive).map(clone)
}

export function findTenant(code: string): Tenant | undefined {
  const found = load().rows.find(tenant => tenant.code === code)
  return found ? clone(found) : undefined
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetTenants(): void {
  db = seed()
  persist()
}
