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
 * *renamed* rather than dropped are handled before that, by `RENAMED`.
 */

import { BUILTIN_ROLES, ALL_PERMISSIONS, type Permission, type Role } from '@/config/permissions'

/**
 * Permission ids that have been renamed, and what they became.
 *
 * The catalogue was realigned to the backend's `{resource}.{action}` naming,
 * and a rename without this map is a silent data loss: `reconcile` drops ids
 * the build no longer defines, so every school's saved role would have come
 * back with `students.view` quietly gone rather than renamed.
 *
 * One old id can become several. `students.manage` was a single write switch
 * and is now create, update, delete and transfer — a school that had granted
 * the one thing meant to grant all of it, so migrating to the whole set
 * preserves what they actually chose. Splitting it further is their decision
 * to make afterwards, in the editor, rather than one made silently here.
 *
 * Keep entries forever. A database is only migrated when it is next loaded,
 * and a browser that has not been opened since the rename is still out there.
 */
const RENAMED: Record<string, Permission[]> = {
  'dashboard.view': ['dashboard.read'],
  'calendar.view': ['calendar.read'],
  'notices.view': ['notices.read'],
  'students.view': ['students.read'],
  'students.manage': ['students.create', 'students.update', 'students.delete', 'students.transfer'],
  'teachers.view': ['teachers.read'],
  'attendance.view': ['attendance.read'],
  'grades.view': ['grades.read'],
  'grades.enter': ['grades.create', 'grades.update'],
  'timetable.view': ['timetable.read'],
  'assignments.view': ['assignments.read'],
  'finance.view': ['finance.read'],
  'transport.view': ['transport.read'],
  'settings.manage': ['system.settings'],
  'users.manage': ['users.read', 'users.create', 'users.update', 'roles.assign'],
}

/** Run a stored id list through the rename map, keeping order and deduping. */
function migrateIds(ids: readonly string[]): Permission[] {
  const out: Permission[] = []
  ids.forEach(id => {
    const replacement = RENAMED[id]
    const next = replacement ?? [id as Permission]
    next.forEach(candidate => {
      if (!out.includes(candidate)) out.push(candidate)
    })
  })
  return out
}

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
 *   release that adds `scopedToAssignedClasses` has to reach schools that
 *   already have a Teacher row, or the new behaviour silently never arrives —
 *   which is exactly what happened the first time. Once a school has set the
 *   field either way, their choice is theirs and survives every upgrade.
 */
function reconcile(role: Role, newPermissions: Set<string>): Role {
  const known = new Set<string>(ALL_PERMISSIONS)
  const permissions = role.permissions.filter(permission => known.has(permission))
  const builtin = BUILTIN_ROLES.find(candidate => candidate.id === role.id)

  const next: Role = { ...role, permissions }

  if (builtin) {
    if (next.scopedToAssignedClasses === undefined) {
      next.scopedToAssignedClasses = builtin.scopedToAssignedClasses
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
          permissions: migrateIds(role.permissions),
        }))

        // A database written before `knownPermissions` existed predates every
        // permission it does not already grant, so treat what it has as what
        // it knew. Migrated too, or a renamed permission would read as brand
        // new and be re-granted to a built-in role that had it removed.
        const known = new Set(
          migrateIds(parsed.knownPermissions ?? migrated.flatMap(role => role.permissions)),
        )
        const brandNew = new Set(ALL_PERMISSIONS.filter(permission => !known.has(permission)))

        const renamed = migrated.some(
          (role, index) => role.permissions.length !== parsed.rows[index].permissions.length,
        )

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
  scopedToAssignedClasses?: boolean
}): Role {
  const database = load()
  const role: Role = {
    id: makeId(input.name, new Set(database.rows.map(existing => existing.id))),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    permissions: [...input.permissions],
    scopedToAssignedClasses: input.scopedToAssignedClasses,
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
    scopedToAssignedClasses?: boolean
  },
): Role | null {
  const database = load()
  const role = database.rows.find(candidate => candidate.id === id)
  if (!role) return null

  if (patch.name !== undefined) role.name = patch.name.trim()
  if (patch.description !== undefined) role.description = patch.description.trim() || undefined
  if (patch.permissions !== undefined) role.permissions = [...patch.permissions]
  if (patch.scopedToAssignedClasses !== undefined) {
    role.scopedToAssignedClasses = patch.scopedToAssignedClasses
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
