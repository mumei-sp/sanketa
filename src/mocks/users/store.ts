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
import { teachersData } from '@/mocks/teachers/teachers'

export interface SchoolUser {
  id: string
  fullName: string
  email: string
  /** Role id from the roles table. */
  roleId: string
  /** Staff record this login belongs to, when it is a member of staff. */
  teacherId?: string
  /** Class sections they may write to, when their role is scoped. */
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
      { id: '1', fullName: 'Surya Admin', email: 'admin@sanketa.edu', roleId: 'admin' },
      { id: '2', fullName: 'Nandini Rao', email: 'principal@sanketa.edu', roleId: 'principal' },
      {
        id: '3',
        fullName: 'Meera Iyengar',
        email: 'teacher@sanketa.edu',
        roleId: 'teacher',
        teacherId: 'T-1006',
        assignedClasses: classesFor('T-1006'),
      },
      { id: '4', fullName: 'Vikram Shah', email: 'accountant@sanketa.edu', roleId: 'accountant' },
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
}): SchoolUser | null {
  const database = load()
  const email = input.email.trim().toLowerCase()
  if (database.rows.some(user => user.email.toLowerCase() === email)) return null

  const user: SchoolUser = {
    id: newId('U'),
    fullName: input.fullName.trim(),
    email,
    roleId: input.roleId,
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
  patch: { roleId?: string; assignedClasses?: string[] },
): SchoolUser | null {
  const database = load()
  const user = database.rows.find(candidate => candidate.id === id)
  if (!user) return null

  if (patch.roleId !== undefined) user.roleId = patch.roleId
  if (patch.assignedClasses !== undefined) user.assignedClasses = [...patch.assignedClasses]

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
