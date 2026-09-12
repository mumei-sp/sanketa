/**
 * Who a person is *at this school*, and what they may do here.
 *
 * Four tables in one key, the way `parents` holds parents and their links
 * together: they are written together and read together, and splitting them
 * would mean four round trips to answer one question.
 *
 *   user_profiles          one row per person at this school
 *   staff                  the employment record, for people who have one
 *   profile_types          the kinds of person this school recognises
 *   profile_roles          which roles each person holds here
 *
 * Per school, all four. That is the whole point: the same login is a teacher
 * at one school and a parent at another, and `roleId` sitting on the global
 * user row could only ever hold one answer.
 *
 * ── One row per person, not one row per account ────────────────────────
 * This used to hold five rows at a school of 1,127 people: a profile existed
 * only where a login did. That is not what `user_profiles` is. Every student,
 * teacher and parent is a person at the school and gets a row, whether or not
 * they can sign in — `userId` is nullable, and for most people it is null.
 *
 * It matters beyond tidiness. With identity only for account-holders there is
 * no single key for a person, so every table keys on a capacity id instead and
 * something has to translate at each boundary; a login arriving later has to
 * be stitched to records that already exist; a role cannot be granted to
 * somebody who never signs in; and the same human in two capacities is two
 * unrelated rows. That last one had to be patched with a runtime phone match,
 * which is gone now — see `StaffGuardianFixture`.
 *
 * ── The profile id *is* the capacity id ────────────────────────────────
 * `students`, `teachers`, `parents` and `staff` each take `profile_id` as
 * their own primary key, all four referencing `user_profiles(id)`. So a
 * teacher's profile id is their row in the faculty list, and a parent's is
 * their row in the parents table. Not a pointer from one to the other: the
 * same id.
 *
 * ── Capacity is not stored ─────────────────────────────────────────────
 * There is no `capacity` column, and no pointer fields either. What someone
 * *is* here is which capacity tables have a row with their id, which is what
 * `capacitiesOf` asks. A person may hold several: the member of staff whose
 * child attends the school has a `teachers` row and a `parents` row under one
 * profile, which is exactly what a single `profileType` could never say.
 *
 * `profile_types` survives alongside as a *classification* a school can extend
 * — "Bus Driver", "Visiting Faculty" — each declaring which record shape it
 * uses. Open codes, closed capacities. See SCHEMA.md.
 */

import { newId } from '@/mocks/_shared'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { listParents, findParent } from '@/mocks/parents'
import { listStudents, findStudent } from '@/mocks/students'
import { teachersData, findTeacher } from '@/mocks/teachers/teachers'
import { getDisplayName } from '@/features/students/utils/formatting'
import { tenantFixtures } from '@/mocks/tenants'

/** A record shape. Closed: a new one is a developer adding a table. */
export type Capacity = 'student' | 'staff' | 'teacher' | 'parent' | 'none'

export interface Profile {
  /** `user_profiles.id`, unique within this school, shared with their records. */
  id: string
  /**
   * `user_profiles.user_id` → the global `users.id`. No FK: it crosses
   * databases.
   *
   * Undefined for everyone who cannot sign in, which at a school is most
   * people. A login arriving later sets this and nothing else moves.
   */
  userId?: string
  /**
   * Denormalised from whichever record they are.
   *
   * `user_profiles` carries the name columns in the schema, and a list of the
   * school's people should not need a join into four tables to render.
   */
  fullName: string
  /**
   * `teacher_classes`, flattened onto the profile.
   *
   * A per-school fact, which is why it cannot live on the global user row: a
   * teacher at two schools is assigned classes at each, and `8A` at one is not
   * `8A` at the other.
   */
  assignedClasses?: string[]
  isDeleted?: boolean
}

/**
 * The employment record — `staff`, keyed on the profile.
 *
 * The capacity nothing else seeds. An administrator, a principal and an
 * accountant have no student, teacher or parent row, so without this they are
 * profiles with no capacity at all — which is what they were, carrying
 * employee numbers that resolved to nothing. SCHEMA-FIXES puts this first in
 * its order for that reason.
 *
 * A teacher is staff who teach, so their `teachers` row implies one; only
 * non-teaching staff need a row here.
 */
export interface StaffRecord {
  /** → `user_profiles.id`. Primary key. */
  profileId: string
  employeeId: string
  designation: string
  department?: string
  joiningDate?: string
}

export interface ProfileType {
  id: string
  /** School-owned and open — `bus-driver`, `visiting-faculty`. */
  code: string
  name: string
  /** Which record shape. Closed, because a capacity is columns, not a label. */
  capacity: Capacity
  /** Seeded by the app; a school may not delete what the app relies on. */
  isBuiltin: boolean
  isActive: boolean
}

export interface ProfileRole {
  profileId: string
  roleId: string
  assignedAt: string
  /**
   * When this assignment lapses, if it does.
   *
   * An acting head of department for one term is a real thing, and a role that
   * expires on its own beats one somebody has to remember to remove.
   */
  expiresAt?: string
}

export interface ProfileTypeLink {
  profileId: string
  profileTypeId: string
  isPrimary: boolean
}

const TABLE = 'profiles'

interface Database {
  profiles: Profile[]
  staff: StaffRecord[]
  types: ProfileType[]
  roles: ProfileRole[]
  typeLinks: ProfileTypeLink[]
  /** Which `access` fixture these rows came from — see `seedSignature`. */
  seed?: string
}

let db: Database | null = null

onTenantSwitch(() => {
  db = null
})

/**
 * The classifications every school starts with.
 *
 * `librarian`, `counselor` and `coordinator` are deliberately absent: they are
 * *roles*, describing what somebody may do rather than what record they have,
 * and the backend's own seed already has them that way.
 */
const BUILTIN_TYPES: Omit<ProfileType, 'id'>[] = [
  { code: 'student', name: 'Student', capacity: 'student', isBuiltin: true, isActive: true },
  { code: 'teacher', name: 'Teacher', capacity: 'teacher', isBuiltin: true, isActive: true },
  { code: 'staff', name: 'Staff', capacity: 'staff', isBuiltin: true, isActive: true },
  { code: 'admin', name: 'Administrator', capacity: 'staff', isBuiltin: true, isActive: true },
  { code: 'parent', name: 'Parent', capacity: 'parent', isBuiltin: true, isActive: true },
  { code: 'guardian', name: 'Guardian', capacity: 'parent', isBuiltin: true, isActive: true },
]

const now = () => new Date().toISOString()

/**
 * A fingerprint of this school's `access` block.
 *
 * Without it, adding a profile to a school's seed is invisible on any browser
 * that has run the app. Over the fixture, never the live rows, so granting
 * somebody a role on the People screen does not reseed the table it was
 * granted in.
 */
function signatureOf(): string {
  return seedSignature(tenantFixtures().access ?? null)
}

/**
 * This school's people, from its own tables.
 *
 * ── The order matters ─────────────────────────────────────────────────
 * A profile row per person, built from the capacity tables: every student on
 * the roster, every teacher on the faculty list, every parent the guardians
 * produced, and every member of the office staff the school's `access` block
 * names. The same id in two of those lists is one person and one row — which
 * is how the teacher who is also a parent comes out as one profile with two
 * capacities.
 *
 * Then the logins are attached. An `access` entry does not create a profile;
 * it finds one and hangs a `users.id` on it, except for staff, whose record
 * this is the only source of.
 *
 * ── Per school ────────────────────────────────────────────────────────
 * That matters more than it looks. While every school seeded the same four
 * profiles, a teacher assigned 8A and 8B at one school arrived at the next
 * already holding 8A and 8B there — and `8A` exists at most schools. The seed
 * being shared was itself the leak the tenant boundary was supposed to
 * prevent.
 *
 * A school with no `access` block still gets its people; what it does not get
 * is anybody who can sign in, which is the true state of a school whose
 * records are loaded and whose staff have not been invited.
 */
function seed(): Database {
  const types: ProfileType[] = BUILTIN_TYPES.map(type => ({ ...type, id: `PT-${type.code}` }))
  const typeId = (code: string) => `PT-${code}`
  const fixtures = tenantFixtures().access

  // ── One row per person ──
  const profiles: Profile[] = []
  const byId = new Map<string, Profile>()
  const upsert = (id: string, fullName: string) => {
    const existing = byId.get(id)
    if (existing) return existing
    const profile: Profile = { id, fullName }
    profiles.push(profile)
    byId.set(id, profile)
    return profile
  }

  listStudents().forEach(student => upsert(String(student.id), getDisplayName(student)))
  teachersData.forEach(teacher =>
    upsert(String(teacher.id), teacher.fullName ?? teacher.displayName ?? teacher.teacherId),
  )
  listParents().forEach(parent => upsert(parent.profileId, parent.fullName))

  // ── The employment records, and the logins ──
  const staff: StaffRecord[] = []
  const roles: ProfileRole[] = []
  const typeLinks: ProfileTypeLink[] = []

  if (fixtures) {
    // A fixture entry refers to itself by `key`, because half of them do not
    // know their own profile id until this runs.
    const idByKey = new Map<string, string>()
    const digits = (value?: string) => (value ?? '').replace(/\D/g, '').slice(-10)

    fixtures.profiles.forEach(entry => {
      let id = entry.id
      if (id === undefined && entry.parentPhone !== undefined) {
        // The parents table minted this one when it seeded the guardians off
        // the roster, so the seed names the number and we find the row.
        id = listParents().find(parent => digits(parent.phone) === digits(entry.parentPhone))
          ?.profileId
      }
      if (id === undefined) return

      // A pure member of staff has no student, teacher or parent record to
      // take a name from, so the seed carries one. `user_profiles` has name
      // columns in the schema for exactly this reason.
      const profile = upsert(id, entry.fullName ?? entry.staff?.designation ?? id)
      profile.userId = entry.userId
      if (entry.assignedClasses) profile.assignedClasses = [...entry.assignedClasses]
      idByKey.set(entry.key, id)

      if (entry.staff) {
        staff.push({
          profileId: id,
          employeeId: entry.staff.employeeId,
          designation: entry.staff.designation,
          department: entry.staff.department,
        })
      }
    })

    // A `parent` role on somebody with no parent record here would scope to no
    // children and read as a permissions bug rather than as missing data.
    const hasParentRecord = (id: string) => listParents().some(parent => parent.profileId === id)

    fixtures.roles.forEach(row => {
      const profileId = idByKey.get(row.key)
      if (!profileId) return
      if (row.roleId === 'parent' && !hasParentRecord(profileId)) return
      roles.push({ profileId, roleId: row.roleId, assignedAt: now(), expiresAt: row.expiresAt })
    })

    fixtures.typeCodes.forEach(row => {
      const profileId = idByKey.get(row.key)
      if (!profileId) return
      if (row.code === 'parent' && !hasParentRecord(profileId)) return
      typeLinks.push({
        profileId,
        profileTypeId: typeId(row.code),
        isPrimary: row.isPrimary === true,
      })
    })
  }

  return { profiles, staff, types, roles, typeLinks, seed: signatureOf() }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      // Every collection has to be there. A half-written database would show
      // people with no roles, which reads as a permissions bug rather than as
      // corrupt storage.
      if (
        Array.isArray(parsed.profiles) &&
        Array.isArray(parsed.staff) &&
        Array.isArray(parsed.types) &&
        Array.isArray(parsed.roles) &&
        Array.isArray(parsed.typeLinks) &&
        parsed.seed === signatureOf()
      ) {
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
    localStorage.setItem(tenantKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

const liveRoles = (rows: ProfileRole[]) => {
  const stamp = now()
  return rows.filter(row => row.expiresAt === undefined || row.expiresAt > stamp)
}

// ── Reads ─────────────────────────────────────────────────────────────

export function listProfiles(): Profile[] {
  return load().profiles.filter(row => !row.isDeleted).map(row => ({ ...row }))
}

/** This login's profile at this school, if they have one here. */
export function profileOf(userId: string): Profile | undefined {
  const found = load().profiles.find(row => row.userId === userId && !row.isDeleted)
  return found ? { ...found } : undefined
}

/**
 * What records this person has here.
 *
 * Asked of the capacity tables rather than read off a column, because that is
 * what a capacity is: `students`, `teachers`, `parents` and `staff` all take
 * `profile_id` as their primary key, so having one is having a row. Plural,
 * and that is the point — the teacher whose child attends comes back
 * `['teacher', 'parent']`.
 */
export function capacitiesOf(profileId: string): Capacity[] {
  const out: Capacity[] = []
  if (findStudent(profileId)) out.push('student')
  if (findTeacher(profileId)) out.push('teacher')
  if (staffOf(profileId)) out.push('staff')
  if (findParent(profileId)) out.push('parent')
  return out
}

/** Their employment record, if they have one. */
export function staffOf(profileId: string): StaffRecord | undefined {
  const found = load().staff.find(row => row.profileId === profileId)
  return found ? { ...found } : undefined
}

/** Everyone at this school with an employment record. */
export function listStaff(): StaffRecord[] {
  return load().staff.map(row => ({ ...row }))
}

export function listProfileTypes(): ProfileType[] {
  return load().types.map(row => ({ ...row }))
}

/** The classifications this person carries here, primary first. */
export function typesOf(profileId: string): ProfileType[] {
  const database = load()
  return database.typeLinks
    .filter(link => link.profileId === profileId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .flatMap(link => {
      const type = database.types.find(row => row.id === link.profileTypeId)
      return type ? [{ ...type }] : []
    })
}

/**
 * The role ids this person holds here. Expired assignments are not roles.
 *
 * Plural, and that is the whole change: the permissions somebody gets are the
 * union of these, each narrowed on its own axis.
 */
export function roleIdsOf(profileId: string): string[] {
  return liveRoles(load().roles)
    .filter(row => row.profileId === profileId)
    .map(row => row.roleId)
}

/** Everyone at this school holding a given role — for a People screen filter. */
export function profilesWithRole(roleId: string): Profile[] {
  const holders = new Set(
    liveRoles(load().roles)
      .filter(row => row.roleId === roleId)
      .map(row => row.profileId),
  )
  return listProfiles().filter(profile => holders.has(profile.id))
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * A profile for somebody the school's own tables do not already know.
 *
 * Which, now that every student, teacher and parent already has one, means
 * office staff — so this takes the employment record with it. Giving somebody
 * an existing profile a login is `attachLogin`, not this.
 */
export function createProfile(
  input: Omit<Profile, 'id'>,
  staff?: Omit<StaffRecord, 'profileId'>,
): Profile {
  const database = load()
  const profile: Profile = { ...input, id: newId('UP') }
  database.profiles.push(profile)
  if (staff) database.staff.push({ profileId: profile.id, ...staff })
  persist()
  return { ...profile }
}

/** Hang a login on a person who is already here. */
export function attachLogin(profileId: string, userId: string): Profile | null {
  return updateProfile(profileId, { userId })
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>): Profile | null {
  const database = load()
  const profile = database.profiles.find(row => row.id === id)
  if (!profile) return null
  Object.assign(profile, patch)
  persist()
  return { ...profile }
}

/** Idempotent on the pair, as `PRIMARY KEY (profile_id, role_id)` requires. */
export function grantRole(profileId: string, roleId: string, expiresAt?: string): void {
  const database = load()
  const existing = database.roles.find(
    row => row.profileId === profileId && row.roleId === roleId,
  )
  if (existing) {
    existing.expiresAt = expiresAt
  } else {
    database.roles.push({ profileId, roleId, assignedAt: now(), expiresAt })
  }
  persist()
}

export function revokeRole(profileId: string, roleId: string): void {
  const database = load()
  database.roles = database.roles.filter(
    row => !(row.profileId === profileId && row.roleId === roleId),
  )
  persist()
}

/** A classification a school invented. Refuses a capacity it does not know. */
export function createProfileType(input: {
  code: string
  name: string
  capacity: Capacity
}): ProfileType | null {
  const database = load()
  const code = input.code.trim().toLowerCase()
  if (!code || database.types.some(row => row.code === code)) return null

  const type: ProfileType = {
    id: newId('PT'),
    code,
    name: input.name.trim() || code,
    capacity: input.capacity,
    isBuiltin: false,
    isActive: true,
  }
  database.types.push(type)
  persist()
  return { ...type }
}

/**
 * Retire a school's own classification. Built-ins refuse.
 *
 * Deactivated rather than deleted, because profiles point at it and a dangling
 * link reads as a person with no kind rather than as a removed option.
 */
export function deactivateProfileType(id: string): boolean {
  const database = load()
  const type = database.types.find(row => row.id === id)
  if (!type || type.isBuiltin) return false
  type.isActive = false
  persist()
  return true
}

export function assignProfileType(profileId: string, profileTypeId: string, isPrimary = false): void {
  const database = load()
  const existing = database.typeLinks.find(
    link => link.profileId === profileId && link.profileTypeId === profileTypeId,
  )
  if (isPrimary) {
    // At most one primary, so promoting one demotes the rest.
    database.typeLinks
      .filter(link => link.profileId === profileId)
      .forEach(link => {
        link.isPrimary = false
      })
  }
  if (existing) existing.isPrimary = isPrimary
  else database.typeLinks.push({ profileId, profileTypeId, isPrimary })
  persist()
}

/**
 * Remove somebody's profile at this school, and everything hanging off it.
 *
 * Their roles and classifications go with it, which is the point: a profile is
 * what those rows are *about*, and leaving them behind would be rows naming a
 * person this school no longer has. The global login is untouched — they can
 * still sign in, and still reach whatever other school they belong to.
 *
 * Exists so that giving somebody a profile is reversible. A directory where
 * one action cannot be taken back is a directory people are afraid of.
 */
export function deleteProfile(profileId: string): boolean {
  const database = load()
  const index = database.profiles.findIndex(row => row.id === profileId)
  if (index === -1) return false
  database.profiles.splice(index, 1)
  database.roles = database.roles.filter(row => row.profileId !== profileId)
  database.typeLinks = database.typeLinks.filter(link => link.profileId !== profileId)
  database.staff = database.staff.filter(row => row.profileId !== profileId)
  persist()
  return true
}

/**
 * Take a login off a profile, leaving the person.
 *
 * What "remove somebody from this school" means for anyone who is also a
 * student, a teacher or a parent here: the account goes, the human stays on
 * the roster. `deleteProfile` is for a profile the school's own tables do not
 * otherwise know about — the office staff this seed created.
 */
export function detachLogin(profileId: string): boolean {
  const database = load()
  const profile = database.profiles.find(row => row.id === profileId)
  if (!profile) return false
  delete profile.userId
  database.roles = database.roles.filter(row => row.profileId !== profileId)
  database.typeLinks = database.typeLinks.filter(link => link.profileId !== profileId)
  persist()
  return true
}
