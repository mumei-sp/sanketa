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
 * Where a user's access lives — not here
 * -------------------------------------
 * This table owns *identity*: what somebody signs in with, and whether they
 * may. It used to own `roleId`, `profileType` and `assignedClasses` too, on
 * the reasoning that all three were facts about the account.
 *
 * They are not. They are facts about a person *at a school*, and this row has
 * one of each — so a teacher at one school and a parent at another had one
 * answer for two questions, and a teacher whose child attends the same school
 * had one answer for two roles. They live in the school's `profile_roles` and
 * `user_profiles` now; see `src/mocks/tenant/profiles`.
 */

import { newId } from '@/mocks/_shared'
import type { AccountStatus } from '@/features/auth/types'
import { globalProfileOf, createGlobalProfile } from '@/mocks/global/profiles/store'
import { globalKey } from '@/mocks/_shared/tenant-context'
import { seedSignature } from '@/mocks/_shared/seed-signature'

export interface SchoolUser {
  id: string
  /**
   * From `GlobalDB.user_profiles.full_name`, joined on the way out.
   *
   * Not stored on this row. `users` is the credential — an id, something to be
   * found by, and whether it may sign in; a name is a fact about the person,
   * and the person is `user_profiles`. It reads as a field here because every
   * caller wants a name beside the account and a join is not their problem.
   */
  fullName: string
  /**
   * Null when the account signs in by number instead.
   *
   * A school knows a family's mobile long before it knows an address, and for
   * most families it never learns one. Requiring an email meant provisioning a
   * parent began with inventing a fact about them, so it is optional — but at
   * least one of `email` and `phone` has to be there, because an account that
   * can be signed into needs something to be found by.
   */
  email: string | null
  /**
   * The number this account signs in with. Unique across the directory.
   *
   * Unique is the whole cost of this feature. Two parents of one child usually
   * give the school the same mobile, and only one of them can hold it — the
   * second needs their own number or an address. `claimedIdentifier` below
   * reports which one clashed so a screen can say so rather than failing.
   */
  phone?: string
  /**
   * Whether it can be signed into.
   *
   * Family accounts are provisioned `disabled` on purpose, and it is worth
   * being clear that the reason has changed. It used to be technical: the
   * services returned every row and filtered in the browser, so a family
   * account that could sign in would have received other children's records
   * and merely not drawn them. That is fixed — the services filter by the
   * caller's scope now.
   *
   * What remains is the reason a school would want anyway: nothing has checked
   * that the address or number on file belongs to that family. Until someone
   * has, an active account is a stranger's login into a child's records. So
   * activation is a person's decision, made per account on the People screen.
   */
  status: AccountStatus
}

const TABLE = 'users'

/** What the table stores. The name is the profile's. */
type UserRow = Omit<SchoolUser, 'fullName'>

interface Database {
  rows: UserRow[]
  /** Which seed these rows came from — see `seedSignature`. */
  seed?: string
}

let db: Database | null = null

const SEED_ROWS: UserRow[] = [
  // Identity only, and now literally so: the names moved to
  // `global/profiles`, which is where the schema keeps them. What each of them
  // *is* at a school lives in that school's folder — see `schools/kendriya`,
  // which gives these ids their profiles, roles and classes.
  { id: '1', email: 'admin@sanketa.edu', status: 'active' },
  { id: '2', email: 'principal@sanketa.edu', status: 'active' },
  { id: '3', email: 'teacher@sanketa.edu', status: 'active' },
  { id: '4', email: 'accountant@sanketa.edu', status: 'active' },
  /**
   * The father with a child at each school.
   *
   * The row this whole global/tenant split exists for: he signs in once and is
   * a parent at two schools, rather than holding two accounts that happen to
   * share a phone number. Until he existed, no seeded login held more than one
   * school — so the switcher rendered nothing, the context token never carried
   * two tenant ids, and its 403-on-a-school-you-do-not-hold was unreachable.
   *
   * `email: null` on purpose. The school has his mobile because that is what a
   * school collects, and sign-in takes a number; most parents never give an
   * address. It is also what makes him the account that proves an email is not
   * required, which is the other thing this row is here to hold down.
   *
   * The number is load-bearing: `9845123457` is what Aarav Sharma's record at
   * Kendriya and Ira Sharma's at Vidya Mandir both name as their father's, and
   * it is how each school's parent table joins him to his own child. Change it
   * here and he silently becomes somebody with two memberships and no
   * children.
   */
  { id: '5', email: null, phone: '9845123457', status: 'active' },
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
      // A file written from an older seed is reseeded rather than migrated —
      // adding a seeded login is invisible otherwise, which is how the
      // two-school father would have gone unnoticed on every browser that had
      // ever run the app. Accounts created by hand since go with it, the same
      // bargain the student directory makes.
      if (
        Array.isArray(parsed.rows) &&
        parsed.rows.length > 0 &&
        parsed.seed === seedSignature(SEED_ROWS)
      ) {
        // Rows written before `status` existed could sign in, which is what
        // every account could at the time. The per-school columns that used to
        // live here are dropped rather than migrated: their values described a
        // school, and a global row cannot say which. `fullName` goes the same
        // way, to `global/profiles` — though in practice the seed fingerprint
        // changed with it, so no stored file reaches this branch carrying one.
        const migrated = parsed.rows.map(row => ({
          id: row.id,
          email: row.email ?? null,
          phone: row.phone,
          status: row.status ?? ('active' as AccountStatus),
        }))
        const changed = JSON.stringify(migrated) !== JSON.stringify(parsed.rows)
        db = { rows: migrated, seed: parsed.seed }
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
    localStorage.setItem(globalKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

/** Row plus the name off `user_profiles`. */
function clone(user: UserRow): SchoolUser {
  return { ...user, fullName: globalProfileOf(user.id)?.fullName ?? user.id }
}

export function listUsers(): SchoolUser[] {
  return load().rows.map(clone)
}

/**
 * Normalised forms of the two things an account can be found by.
 *
 * A number is compared on its last ten digits, so `+91 98451 23457`,
 * `9845123457` and `098451-23457` are one identifier. That is the same
 * comparison the guardians table uses to decide whether two guardians are one
 * person, and it has to be, or a school could hold a number in the directory
 * under one spelling and fail to match the account under another.
 */
const asEmail = (value: string | null | undefined) => value?.trim().toLowerCase() || undefined
const asPhone = (value: string | null | undefined) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? digits : undefined
}

/**
 * Find an account by whatever the person typed.
 *
 * One function rather than `findByEmail` and `findByPhone`, because the sign-in
 * form has one field and does not know which it was given — and neither should
 * it. Whether the string looks like an address is not the question; whether it
 * matches an account is.
 */
export function findByIdentifier(identifier: string): SchoolUser | undefined {
  const email = asEmail(identifier)
  const phone = asPhone(identifier)
  const found = load().rows.find(
    user =>
      (email !== undefined && asEmail(user.email) === email) ||
      (phone !== undefined && asPhone(user.phone) === phone),
  )
  return found ? clone(found) : undefined
}

/**
 * Which of an account's identifiers is already taken, if either.
 *
 * Returned rather than thrown, and naming the field, because "that email
 * already has an account" and "that number already has an account" are
 * different things for a school to do about — the second is the ordinary case
 * of two parents sharing a mobile, and the fix is to ask for the other
 * parent's number rather than to conclude the account exists.
 */
export function claimedIdentifier(input: {
  email?: string | null
  phone?: string
  exceptId?: string
}): 'email' | 'phone' | null {
  const email = asEmail(input.email)
  const phone = asPhone(input.phone)
  const rows = load().rows.filter(user => user.id !== input.exceptId)
  if (email !== undefined && rows.some(user => asEmail(user.email) === email)) return 'email'
  if (phone !== undefined && rows.some(user => asPhone(user.phone) === phone)) return 'phone'
  return null
}

/**
 * Add an account.
 *
 * Name, one contact detail, and the role they start in. No password: the mock
 * auth accepts one shared one, and inventing a per-user credential here would
 * be pretending to a security this app does not have. A backend would send an
 * invitation and let the person set their own.
 *
 * Returns null when there is nothing to sign in with, or when either
 * identifier is already claimed. Callers that need to tell a school *which*
 * clashed should ask `claimedIdentifier` first; this is the guard, not the
 * explanation.
 */
export function createUser(input: {
  fullName: string
  email?: string | null
  phone?: string
  roleId: string
  status?: AccountStatus
  /**
   * Set when the account is being attached to somebody the school already has
   * a record for. Decides the default status — see below.
   */
  studentId?: string
  guardianId?: string
  assignedClasses?: string[]
}): SchoolUser | null {
  const database = load()
  const email = asEmail(input.email) ?? null
  const phone = input.phone?.trim() || undefined
  // An account with neither is one nobody can sign into and nothing can find.
  if (email === null && asPhone(phone) === undefined) return null
  if (claimedIdentifier({ email, phone }) !== null) return null

  // Typed in, or provisioned from a record the school already holds.
  const provisioned = input.studentId !== undefined || input.guardianId !== undefined
  const user: UserRow = {
    id: newId('U'),
    email,
    phone,
    // Derived, not defaulted to 'active' and left to callers. Making it depend
    // on each call site passing `status` was the first version, and it created
    // a live parent account the first time a caller forgot. The safe state is
    // the one you get by saying nothing.
    //
    // Derived from *how* the account was created rather than from what kind of
    // person it belongs to. Somebody an admin typed in on the People screen has
    // been looked at by a person, and starts active. An account provisioned
    // against an existing record — a parent off the roster, a student off the
    // directory — has not: nothing has checked that the number on file reaches
    // that family, so it starts disabled until somebody says it does.
    //
    // It used to read the profile type, which meant this table knew the names
    // of a *tenant* table's rows — and got them wrong the moment a school
    // invented one, since an unrecognised code fell through to 'active'.
    status: input.status ?? (provisioned ? 'disabled' : 'active'),
  }
  database.rows.push(user)
  persist()
  // Two tables, in the order the foreign key requires: the account, then the
  // person behind it. A `users` row with no profile is what the schema's
  // `UNIQUE NOT NULL user_id` exists to prevent.
  createGlobalProfile(user.id, { fullName: input.fullName.trim(), primaryPhone: phone })
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
  patch: { status?: AccountStatus },
): SchoolUser | null {
  const database = load()
  const user = database.rows.find(candidate => candidate.id === id)
  if (!user) return null

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
