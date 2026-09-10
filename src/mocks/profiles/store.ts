/**
 * Who a person is *at this school*, and what they may do here.
 *
 * Three tables in one key, the way `parents` holds parents and their links
 * together: they are written together and read together, and splitting them
 * would mean three round trips to answer one question.
 *
 *   user_profiles          one row per person at this school
 *   profile_types          the kinds of person this school recognises
 *   profile_roles          which roles each person holds here
 *
 * Per school, all three. That is the whole point: the same login is a teacher
 * at one school and a parent at another, and `roleId` sitting on the global
 * user row could only ever hold one answer.
 *
 * ── Capacity is not stored ─────────────────────────────────────────────
 * There is no `capacity` column on a profile. What someone *is* here is which
 * capacity records point at them — `studentId`, `teacherId`, `parentId`,
 * `staffId` below are those pointers, and a person may hold several. The
 * member of staff whose child attends the school has a `teacherId` and a
 * `parentId`, which is exactly what the old single `profileType` could not
 * say. See SCHEMA.md.
 *
 * `profile_types` survives alongside as a *classification* a school can extend
 * — "Bus Driver", "Visiting Faculty" — each declaring which record shape it
 * uses. Open codes, closed capacities.
 */

import { newId } from '@/mocks/_shared'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { listParents } from '@/mocks/parents'
import { tenantFixtures } from '@/mocks/tenants'

/** A record shape. Closed: a new one is a developer adding a table. */
export type Capacity = 'student' | 'staff' | 'teacher' | 'parent' | 'none'

export interface Profile {
  /** `user_profiles.id`, unique within this school. */
  id: string
  /** `user_profiles.user_id` → the global `users.id`. No FK: it crosses databases. */
  userId: string
  /** Capacity pointers. Several may be set; that is the point. */
  studentId?: string
  teacherId?: string
  parentId?: string
  staffId?: string
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
 * This school's people, from its own folder.
 *
 * Per school, and that matters more than it looks. While every school seeded
 * the same four profiles, a teacher assigned 8A and 8B at one school arrived
 * at the next already holding 8A and 8B there — and `8A` exists at most
 * schools. The seed being shared was itself the leak the tenant boundary was
 * supposed to prevent.
 *
 * A school with no `access` block gets no profiles, which is the true answer
 * for a school nobody has been given a job at yet.
 */
function seed(): Database {
  const types: ProfileType[] = BUILTIN_TYPES.map(type => ({ ...type, id: `PT-${type.code}` }))
  const typeId = (code: string) => `PT-${code}`
  const fixtures = tenantFixtures().access

  if (!fixtures) return { profiles: [], types, roles: [], typeLinks: [] }

  // Parent ids are generated when the parents table seeds itself from this
  // school's roster, so a fixture states a number and the join happens here.
  // Last ten digits, which is how the parents table decides two guardians are
  // one person.
  const digits = (value?: string) => (value ?? '').replace(/\D/g, '').slice(-10)
  const parents = listParents()
  const parentIdFor = (phone?: string) =>
    phone === undefined
      ? undefined
      : parents.find(parent => digits(parent.phone) === digits(phone))?.profileId

  const profiles: Profile[] = fixtures.profiles.map(fixture => ({
    id: fixture.id,
    userId: fixture.userId,
    studentId: fixture.studentId,
    teacherId: fixture.teacherId,
    staffId: fixture.staffId,
    parentId: parentIdFor(fixture.parentPhone),
    assignedClasses: fixture.assignedClasses ? [...fixture.assignedClasses] : undefined,
  }))

  const hasParentRecord = new Set(
    profiles.filter(profile => profile.parentId !== undefined).map(profile => profile.id),
  )

  // A `parent` role on somebody with no parent record here would scope to no
  // children and read as a permissions bug rather than as missing data.
  const roles: ProfileRole[] = fixtures.roles
    .filter(row => row.roleId !== 'parent' || hasParentRecord.has(row.profileId))
    .map(row => ({
      profileId: row.profileId,
      roleId: row.roleId,
      assignedAt: now(),
      expiresAt: row.expiresAt,
    }))

  const typeLinks: ProfileTypeLink[] = fixtures.typeCodes
    .filter(row => row.code !== 'parent' || hasParentRecord.has(row.profileId))
    .map(row => ({
      profileId: row.profileId,
      profileTypeId: typeId(row.code),
      isPrimary: row.isPrimary === true,
    }))

  return { profiles, types, roles, typeLinks, seed: signatureOf() }
}

/**
 * A fingerprint of this school's `access` block.
 *
 * Without it, adding a profile to a school's seed is invisible on any browser
 * that has run the app — which is how giving Rohan Sharma a profile at each
 * school would have changed nothing at all for anyone but a first-time
 * visitor. Over the fixture, never the live rows, so granting somebody a role
 * on the People screen does not reseed the table it was granted in.
 */
function signatureOf(): string {
  return seedSignature(tenantFixtures().access ?? null)
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

export function createProfile(input: Omit<Profile, 'id'>): Profile {
  const database = load()
  const profile: Profile = { ...input, id: newId('UP') }
  database.profiles.push(profile)
  persist()
  return { ...profile }
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
  persist()
  return true
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetProfiles(): void {
  db = seed()
  persist()
}
