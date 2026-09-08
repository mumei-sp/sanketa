/**
 * The mock role server's database.
 *
 * Stands in for the table a backend would own, and is shaped like one: rows
 * with ids, reads and writes through functions, and `localStorage` as its
 * disk. Nothing in `src/features/` may touch that key — the only way in or out
 * is `role-service.ts`, exactly as the only way into a real table is the API.
 *
 * Seeding, not merging. The built-in roles are written on first run and then
 * belong to the school: if an admin removes `finance.view` from Principal,
 * that decision survives, where a merge-on-load would quietly restore it every
 * refresh. New *permissions* added by a release are a different matter and are
 * handled in `load` — an unknown id is dropped rather than left dangling.
 */

import { BUILTIN_ROLES, ALL_PERMISSIONS, type Permission, type Role } from '@/config/permissions'

const DB_KEY = 'sanketa:mock-db:roles'

interface Database {
  rows: Role[]
}

let db: Database | null = null

function seed(): Database {
  return { rows: BUILTIN_ROLES.map(role => ({ ...role, permissions: [...role.permissions] })) }
}

/** Drop permission ids the running build no longer defines. */
function prune(role: Role): Role {
  const known = new Set<string>(ALL_PERMISSIONS)
  const permissions = role.permissions.filter(permission => known.has(permission))
  return permissions.length === role.permissions.length ? role : { ...role, permissions }
}

function load(): Database {
  if (db) return db

  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        // A release can add built-in roles as well as permissions; append any
        // the stored database has never seen rather than reseeding over the
        // school's edits.
        const seen = new Set(parsed.rows.map(role => role.id))
        const missing = BUILTIN_ROLES.filter(role => !seen.has(role.id)).map(role => ({
          ...role,
          permissions: [...role.permissions],
        }))
        db = { rows: [...parsed.rows.map(prune), ...missing] }
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
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode. The in-memory copy still serves this session,
    // which is the same degradation a backend outage would produce.
  }
}

function clone(role: Role): Role {
  return { ...role, permissions: [...role.permissions] }
}

// ── Reads ─────────────────────────────────────────────────────────────

export function listRoles(): Role[] {
  return load().rows.map(clone)
}

export function getRole(id: string): Role | null {
  const found = load().rows.find(role => role.id === id)
  return found ? clone(found) : null
}

// ── Writes ────────────────────────────────────────────────────────────

/** Slugify a name into an id, uniquified against what already exists. */
function makeId(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'role'
  if (!taken.has(base)) return base
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function createRole(input: {
  name: string
  description?: string
  permissions: Permission[]
}): Role {
  const database = load()
  const role: Role = {
    id: makeId(input.name, new Set(database.rows.map(existing => existing.id))),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    permissions: [...input.permissions],
  }
  database.rows.push(role)
  persist()
  return clone(role)
}

/**
 * Patch a role.
 *
 * `id` and `builtin` are not patchable: the id is a foreign key held on every
 * user, and letting a role stop being built-in would make it deletable and
 * strand whoever holds it.
 */
export function updateRole(
  id: string,
  patch: { name?: string; description?: string; permissions?: Permission[] },
): Role | null {
  const database = load()
  const role = database.rows.find(candidate => candidate.id === id)
  if (!role) return null

  if (patch.name !== undefined) role.name = patch.name.trim()
  if (patch.description !== undefined) role.description = patch.description.trim() || undefined
  if (patch.permissions !== undefined) role.permissions = [...patch.permissions]

  persist()
  return clone(role)
}

/** Built-in roles refuse deletion; every other row goes. */
export function deleteRole(id: string): boolean {
  const database = load()
  const index = database.rows.findIndex(role => role.id === id)
  if (index === -1) return false
  if (database.rows[index].builtin) return false
  database.rows.splice(index, 1)
  persist()
  return true
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetRoles(): void {
  db = seed()
  persist()
}
