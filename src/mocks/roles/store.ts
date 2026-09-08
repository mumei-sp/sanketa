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
 * refresh. What a release adds is a different matter and is handled by
 * `reconcile` on load: unknown permission ids are dropped, and fields added to
 * a built-in role since the row was written are backfilled. Ids that were
 * *renamed* rather than dropped are handled before that, by
 * `migratePermissionIds` — which the catalogue owns, because this is not the
 * only table that persists an id.
 */

import {
  BUILTIN_ROLES,
  ALL_PERMISSIONS,
  migratePermissionIds,
  needsPermissionMigration,
  type Permission,
  type Role,
  type ScopeAxis,
} from '@/config/permissions'

const DB_KEY = 'sanketa:mock-db:roles'

interface Database {
  rows: Role[]
  /**
   * Every permission id this database has already been told about.
   *
   * Without it there is no way to tell "the admin removed this" from "this
   * did not exist when the row was written", and the two need opposite
   * treatment: the first must be respected, the second must be granted or a
   * permission added by a release is unreachable forever. `users.manage`
   * shipped and no existing install could see the screen behind it.
   */
  knownPermissions?: string[]
}

let db: Database | null = null

function seed(): Database {
  return {
    rows: BUILTIN_ROLES.map(role => ({ ...role, permissions: [...role.permissions] })),
    knownPermissions: [...ALL_PERMISSIONS],
  }
}

/**
 * Bring a stored row up to date with the running build.
 *
 * Two different jobs, and the distinction matters:
 *
 *   Permissions the build no longer defines are dropped — a stored id with no
 *   definition behind it can never be granted, and leaving it makes the role
 *   editor show a switch for something that does not exist.
 *
 *   Fields added to a built-in role since the row was written are backfilled,
 *   but *only* when the stored row has no opinion at all (`undefined`). A
 *   release that adds `scopeBy` has to reach schools that
 *   already have a Teacher row, or the new behaviour silently never arrives —
 *   which is exactly what happened the first time. Once a school has set the
 *   field either way, their choice is theirs and survives every upgrade.
 */
function reconcile(role: Role, newPermissions: Set<string>): Role {
  const known = new Set<string>(ALL_PERMISSIONS)
  const permissions = role.permissions.filter(permission => known.has(permission))
  const builtin = BUILTIN_ROLES.find(candidate => candidate.id === role.id)

  const next: Role = { ...role, permissions }

  // `scopedToAssignedClasses: true` was the only scoping there was, so it
  // means the classes axis. Read off the row rather than deleted from it: the
  // stored copy is harmless, and leaving it means a browser that loads an
  // older build of the app still finds what it expects.
  const legacy = (role as Role & { scopedToAssignedClasses?: boolean })
    .scopedToAssignedClasses
  if (next.scopeBy === undefined && legacy === true) next.scopeBy = 'classes'

  if (builtin) {
    if (next.scopeBy === undefined && legacy === undefined) {
      next.scopeBy = builtin.scopeBy
    }
    // Permissions the build has never offered before are granted per the
    // built-in definition. Ones it has offered are left alone, so a removal
    // the school made survives.
    const additions = builtin.permissions.filter(
      permission => newPermissions.has(permission) && !next.permissions.includes(permission),
    )
    if (additions.length > 0) next.permissions = [...next.permissions, ...additions]
  }

  return next
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

        // Renames first: everything below compares stored ids against the
        // catalogue, and a pre-rename database would lose every comparison.
        const migrated = parsed.rows.map(role => ({
          ...role,
          permissions: migratePermissionIds(role.permissions),
        }))

        // A database written before `knownPermissions` existed predates every
        // permission it does not already grant, so treat what it has as what
        // it knew. Migrated too, or a renamed permission would read as brand
        // new and be re-granted to a built-in role that had it removed.
        const known = new Set(
          migratePermissionIds(parsed.knownPermissions ?? migrated.flatMap(role => role.permissions)),
        )
        const brandNew = new Set(ALL_PERMISSIONS.filter(permission => !known.has(permission)))

        // Asked of the *stored* ids, not inferred from the migrated ones: a
        // role whose ids are all one-to-one renames keeps its length, so a
        // length comparison would call it unchanged and never write it back.
        const renamed =
          parsed.rows.some(role => needsPermissionMigration(role.permissions)) ||
          needsPermissionMigration(parsed.knownPermissions ?? [])

        db = {
          rows: [...migrated.map(role => reconcile(role, brandNew)), ...missing],
          knownPermissions: [...ALL_PERMISSIONS],
        }
        // Write back when anything actually moved, so the migration runs once
        // rather than on every load.
        if (brandNew.size > 0 || renamed || missing.length > 0) persist()
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
  /** Carried on create so duplicating a scoped role produces a scoped one. */
  scopeBy?: ScopeAxis | 'none'
}): Role {
  const database = load()
  const role: Role = {
    id: makeId(input.name, new Set(database.rows.map(existing => existing.id))),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    permissions: [...input.permissions],
    scopeBy: input.scopeBy === 'none' ? undefined : input.scopeBy,
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
  patch: {
    name?: string
    description?: string
    permissions?: Permission[]
    scopeBy?: ScopeAxis | 'none'
  },
): Role | null {
  const database = load()
  const role = database.rows.find(candidate => candidate.id === id)
  if (!role) return null

  if (patch.name !== undefined) role.name = patch.name.trim()
  if (patch.description !== undefined) role.description = patch.description.trim() || undefined
  if (patch.permissions !== undefined) role.permissions = [...patch.permissions]
  if (patch.scopeBy !== undefined) {
    // `'none'` rather than `undefined` for "not narrowed": every field here is
    // skipped when undefined, which is what makes a patch partial, so there
    // would otherwise be no way to express clearing the axis.
    role.scopeBy = patch.scopeBy === 'none' ? undefined : patch.scopeBy
  }

  persist()
  return clone(role)
}

/**
 * Put a deleted role back, keeping its id.
 *
 * The id is what every user row points at, so a "restore" that minted a new
 * one would bring the role back and leave its holders orphaned — which is the
 * thing undoing a deletion is for. Refuses when the id is taken rather than
 * overwriting whatever now holds it.
 *
 * Its position in the list is not restored; the row goes back on the end.
 * Order here is insertion order and carries no meaning.
 */
export function restoreRole(role: Role): Role | null {
  const database = load()
  if (database.rows.some(existing => existing.id === role.id)) return null
  database.rows.push({ ...role, permissions: [...role.permissions] })
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
