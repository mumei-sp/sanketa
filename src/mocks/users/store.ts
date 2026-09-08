/**
 * The mock user directory.
 *
 * The app had no such thing: four accounts hard-coded in the auth mock, and a
 * role that only a login could set. So a school could define "Librarian" in
 * the role editor and have no way to make anyone one — the mechanism existed
 * and the administration did not.
 *
 * Same shape as the roles and notification tables: rows with ids, reads and
 * writes through functions, `localStorage` as the disk, and only a service
 * allowed to import it.
 *
 * Where a user's access lives
 * ---------------------------
 * `roleId` and `assignedClasses` both sit on the user row, because both are
 * facts about *the account*, and both have to be stamped into the session at
 * sign-in. `Teacher.assignedClasses` on the staff record seeds this and stays
 * as the domain view of the same fact; a backend would resolve one from the
 * other at login rather than keeping two writable copies, and this store is
 * the one auth reads.
 */

import { newId } from '@/mocks/_shared'
import type { AccountStatus, ProfileType } from '@/features/auth/types'
import { teachersData } from '@/mocks/teachers/teachers'

export interface SchoolUser {
  id: string
  fullName: string
  email: string
  /** Role id from the roles table. */
  roleId: string
  /**
   * Structural kind of account.
   *
   * Distinct from the role, and not editable in the role editor: a school
   * decides what a Parent may see, not that a parent is staff. It also decides
   * which record the account points at — `teacherId`, `studentId` or
   * `parentId` below — and therefore which axis narrows it.
   */
  profileType: ProfileType
  /**
   * Whether it can be signed into.
   *
   * Accounts are provisioned `disabled` on purpose. The services do not filter
   * rows by the caller's scope yet, so a family account that could sign in
   * would receive every child's records and merely not draw them. The door
   * stays shut until that lands; see the Accounts plan's phase 3.
   */
  status: AccountStatus
  /** Staff record this login belongs to, when it is a member of staff. */
  teacherId?: string
  /** Student record this login *is*, for a student account. */
  studentId?: string
  /** Parent record this login belongs to, for a parent or guardian account. */
  parentId?: string
  /** Class sections they may write to, when their role narrows by class. */
  assignedClasses?: string[]
}

const DB_KEY = 'sanketa:mock-db:users'

interface Database {
  rows: SchoolUser[]
}

let db: Database | null = null

/** The teacher record a seeded account belongs to, for its class assignment. */
function classesFor(teacherId: string): string[] {
  return teachersData.find(teacher => teacher.teacherId === teacherId)?.assignedClasses ?? []
}

function seed(): Database {
  return {
    rows: [
      { id: '1', fullName: 'Surya Admin', email: 'admin@sanketa.edu', roleId: 'admin', profileType: 'admin', status: 'active' },
      { id: '2', fullName: 'Nandini Rao', email: 'principal@sanketa.edu', roleId: 'principal', profileType: 'staff', status: 'active' },
      {
        id: '3',
        fullName: 'Meera Iyengar',
        email: 'teacher@sanketa.edu',
        roleId: 'teacher',
        profileType: 'teacher',
        status: 'active',
        teacherId: 'T-1006',
        assignedClasses: classesFor('T-1006'),
      },
      { id: '4', fullName: 'Vikram Shah', email: 'accountant@sanketa.edu', roleId: 'accountant', profileType: 'staff', status: 'active' },
    ],
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        // Rows written before these columns existed are staff who can sign in
        // — which is what every account was at the time.
        const migrated = parsed.rows.map(row => ({
          ...row,
          profileType: row.profileType ?? ('staff' as ProfileType),
          status: row.status ?? ('active' as AccountStatus),
        }))
        const changed = parsed.rows.some(row => !row.profileType || !row.status)
        db = { rows: migrated }
        if (changed) persist()
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
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

function clone(user: SchoolUser): SchoolUser {
  return { ...user, assignedClasses: user.assignedClasses ? [...user.assignedClasses] : undefined }
}

export function listUsers(): SchoolUser[] {
  return load().rows.map(clone)
}

export function findByEmail(email: string): SchoolUser | undefined {
  const wanted = email.trim().toLowerCase()
  const found = load().rows.find(user => user.email.toLowerCase() === wanted)
  return found ? clone(found) : undefined
}

/**
 * Kinds that belong to a family rather than to the school.
 *
 * They narrow by student rather than by class, and they are the ones that must
 * not be signable-into before the services filter.
 */
function isFamily(profileType: ProfileType): boolean {
  return profileType === 'student' || profileType === 'parent' || profileType === 'guardian'
}

/**
 * Add an account.
 *
 * Name and email only, plus the role they start in. No password: the mock
 * auth accepts one shared one, and inventing a per-user credential here would
 * be pretending to a security this app does not have. A backend would send an
 * invitation and let the person set their own.
 *
 * Returns null when the email is taken — the one uniqueness a directory has to
 * enforce, because sign-in resolves an account by it.
 */
export function createUser(input: {
  fullName: string
  email: string
  roleId: string
  profileType?: ProfileType
  status?: AccountStatus
  studentId?: string
  parentId?: string
  assignedClasses?: string[]
}): SchoolUser | null {
  const database = load()
  const email = input.email.trim().toLowerCase()
  if (database.rows.some(user => user.email.toLowerCase() === email)) return null

  const profileType = input.profileType ?? 'staff'
  const user: SchoolUser = {
    id: newId('U'),
    fullName: input.fullName.trim(),
    email,
    roleId: input.roleId,
    profileType,
    // Derived from the kind, not defaulted to 'active' and left to callers.
    //
    // A member of staff typed in on the People screen is someone an admin is
    // adding now, and starts active. A student or family account is
    // *provisioned* — created ahead of being usable — and must start disabled,
    // because the services do not filter rows by the caller's scope yet.
    //
    // Making that depend on each call site passing `status` was the first
    // version, and it created a live parent account the first time a caller
    // forgot. The safe state is the one you get by saying nothing.
    status: input.status ?? (isFamily(profileType) ? 'disabled' : 'active'),
    studentId: input.studentId,
    parentId: input.parentId,
    assignedClasses: input.assignedClasses,
  }
  database.rows.push(user)
  persist()
  return clone(user)
}

/**
 * Patch a user's access.
 *
 * Name and email are not patchable here: this is the access screen, and
 * letting it rewrite identity would make "who is this" and "what may they do"
 * the same edit.
 */
export function updateUser(
  id: string,
  patch: { roleId?: string; assignedClasses?: string[]; status?: AccountStatus },
): SchoolUser | null {
  const database = load()
  const user = database.rows.find(candidate => candidate.id === id)
  if (!user) return null

  if (patch.roleId !== undefined) user.roleId = patch.roleId
  if (patch.assignedClasses !== undefined) user.assignedClasses = [...patch.assignedClasses]
  if (patch.status !== undefined) user.status = patch.status

  persist()
  return clone(user)
}

/**
 * Remove an account.
 *
 * Only exists so adding one can be undone. Whether removing a particular
 * person would lock the school out of its own settings is not a question this
 * table can answer — it does not know what a role grants — so that guard lives
 * with the caller, next to the roles it needs to read.
 */
export function deleteUser(id: string): boolean {
  const database = load()
  const index = database.rows.findIndex(user => user.id === id)
  if (index === -1) return false
  database.rows.splice(index, 1)
  persist()
  return true
}

/**
 * Put a removed account back, keeping its id.
 *
 * The mirror of `restoreRole`, and needed for the same reason: undoing is
 * itself a change, so removing an account has to be reversible or the log
 * would have a one-way door in it. Refuses when the id is taken.
 */
export function restoreUser(user: SchoolUser): SchoolUser | null {
  const database = load()
  if (database.rows.some(existing => existing.id === user.id)) return null
  database.rows.push(clone(user))
  persist()
  return clone(user)
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetUsers(): void {
  db = seed()
  persist()
}
