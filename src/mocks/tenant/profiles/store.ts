/**
 * Who a person is *at this school*, and what they may do here.
 *
 * Four tables in one key, the way `guardians` holds guardians and their links
 * together: they are written together and read together, and splitting them
 * would mean four round trips to answer one question.
 *
 *   user_profiles              one row per person at this school
 *   staff                      the employment record, for people who have one
 *   profile_types              the kinds of person this school recognises
 *   profile_type_assignments   which kinds each person is
 *   profile_roles              which roles each person holds here
 *
 * Per school, all five. That is the whole point: the same login is a teacher
 * at one school and a parent at another, and `roleId` sitting on the global
 * user row could only ever hold one answer.
 *
 * ── One row per person, not one row per account ────────────────────────
 * This used to hold five rows at a school of 1,127 people: a profile existed
 * only where a login did. That is not what `user_profiles` is. Every student,
 * teacher and guardian is a person at the school and gets a row, whether or not
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
 * `students`, `teachers`, `guardians` and `staff` each take `profile_id` as
 * their own primary key, all four referencing `user_profiles(id)`. So a
 * teacher's profile id is their row in the faculty list, and a guardian's is
 * their row in the guardians table. Not a pointer from one to the other: the
 * same id.
 *
 * ── Capacity is not stored ─────────────────────────────────────────────
 * There is no `capacity` column, and no pointer fields either. What someone
 * *is* here is which capacity tables have a row with their id, which is what
 * `capacitiesOf` asks. A person may hold several: the member of staff whose
 * child attends the school has a `teachers` row and a `guardians` row under one
 * profile, which is exactly what a single `profileType` could never say.
 *
 * `profile_types` survives alongside as a *classification* a school can extend
 * — "Bus Driver", "Visiting Faculty" — each declaring which record shape it
 * uses. Open codes, closed capacities. See SCHEMA.md.
 */

import { newId } from '@/mocks/_shared'
import { updateGlobalProfile, REPLICATED_COLUMNS } from '@/mocks/global/profiles/store'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { deriveFamilies, familiesSignature, digitsOf } from '@/mocks/tenant/guardians/derive'
import { departmentOf } from '@/mocks/tenant/teachers/department'
import { getDisplayName } from '@/features/students/utils/formatting'
import { tenantFixtures } from '@/mocks/schools'

/** A record shape. Closed: a new one is a developer adding a table. */
export type Capacity = 'student' | 'staff' | 'teacher' | 'guardian'

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

  // ── The replicated columns ────────────────────────────────────────────
  //
  // Exactly the subset GlobalDB.user_profiles syncs down, and the reason they
  // are here rather than on `students` and `teachers`: they are facts about
  // the *person*, true at whichever school she walks into. The capacity row
  // below carries only what is true of her here — an admission number, an
  // employee id.
  //
  // They used to live on the capacity rows, with `fullName` copied onto the
  // profile beside them. Two copies of a name is one that can go stale, and
  // the same teacher's name was stored once per school she taught at.
  firstName?: string
  middleName?: string
  lastName?: string
  /** Nullable in the schema and derivable, but always written here. */
  fullName: string
  preferredName?: string
  displayName?: string
  dateOfBirth?: string
  /** 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY, as in the schema. */
  gender?: 0 | 1 | 2 | 3
  primaryPhone?: string
  /** Dialling code paired with `primaryPhone`. Not a schema column yet. */
  phoneCountryCode?: string
  profilePictureUrl?: string
  /** Sync metadata. Never written here: nothing syncs in a browser. */
  syncedAt?: string
  syncVersion?: number

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
 * The columns a capacity row hands over to the profile.
 *
 * Named once, because three stores split their fixtures on this list and a
 * fourth would have to agree with them. `id` is deliberately absent: it is on
 * both sides, being the same id.
 */
export const PERSON_COLUMNS = [
  'userId',
  'firstName',
  'middleName',
  'lastName',
  'fullName',
  'preferredName',
  'displayName',
  'dateOfBirth',
  'gender',
  'primaryPhone',
  'phoneCountryCode',
  'profilePictureUrl',
  'syncedAt',
  'syncVersion',
] as const

type PersonColumn = (typeof PERSON_COLUMNS)[number]

/** What a capacity store stores: its own row, with the person columns taken out. */
export type CapacityRow<T> = Omit<T, PersonColumn>

/**
 * Split a whole-person record into the half each table keeps.
 *
 * The fixtures are authored as people — a student is written with her name and
 * her roll number together, which is the readable way to write a seed. This is
 * where that becomes two rows.
 */
export function splitPerson<T extends object>(
  record: T,
): { person: Partial<Profile>; row: CapacityRow<T> } {
  const person: Record<string, unknown> = {}
  const row: Record<string, unknown> = {}
  const columns = new Set<string>(PERSON_COLUMNS)
  Object.entries(record).forEach(([key, value]) => {
    if (columns.has(key)) person[key] = value
    else row[key] = value
  })
  return { person: person as Partial<Profile>, row: row as CapacityRow<T> }
}

/**
 * The employment record — `staff`, keyed on the profile.
 *
 * The capacity nothing else seeds. An administrator, a principal and an
 * accountant have no student, teacher or guardian row, so without this they are
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
  department?: string
  joiningDate?: string
  /**
   * → `staff_designations.id`. One, because a job title is one thing.
   *
   * The member of staff who drives the bus *and* runs the library is one
   * designation and two **roles** — and roles are where plurality belongs,
   * because they carry permissions. A title is what the letterhead says.
   */
  designationId?: string
}

/**
 * A job title a school employs people under — `staff_designations`.
 *
 * ── What this replaced, and why ────────────────────────────────────────
 * There used to be `profile_types` and `profile_type_assignments`: a
 * school-extensible catalogue of "kinds of person", each naming a `capacity`
 * that told you which table carried the record, joined many-to-many to
 * profiles. It was an elaborate way of saying *job title*.
 *
 * Two facts were tangled in it. What records somebody has is structural, and
 * already answered by which capacity tables hold their id — `capacitiesOf`
 * derives it and cannot disagree with itself. What somebody's job is called is
 * a label, and only staff have one: a student is a student, a guardian is a
 * guardian, and neither needs naming. Untangling them deletes both tables and
 * the `capacity` column, and with them the seam where a type could name a
 * table SQL had no way to foreign-key.
 *
 * ── Why a catalogue and not free text ─────────────────────────────────
 * A title typed per person gives you "Bus Driver", "bus driver" and
 * "Driver (Bus)" across an estate of schools, which makes headcount-by-title a
 * fuzzy-match problem and renaming one a spelling exercise. A row has an id:
 * reporting groups by it, a restructure edits one row, and retiring a title is
 * `isActive = false` rather than a delete that strands whoever held it.
 *
 * There is no `isBuiltin`. Job titles are the school's, all of them —
 * `ON DELETE RESTRICT` already stops one being removed while somebody holds
 * it, which is the only protection that was ever needed.
 */
export interface StaffDesignation {
  id: string
  /** School-owned and open — `bus-driver`, `visiting-faculty`. */
  code: string
  name: string
  /** Retired rather than deleted, so rows that point at it still resolve. */
  isActive: boolean
}

export interface ProfileRole {
  profileId: string
  roleId: string
  assignedAt: string
  /**
   * The profile that granted it — `profile_roles.assigned_by`.
   *
   * The access log records the act as an event, which answers "what happened
   * on Tuesday". This answers the question asked six months later, of a row
   * rather than a day: *who gave this person this?* A log can be read past; a
   * column on the grant cannot.
   *
   * Optional because the seed grants roles with nobody to attribute them to —
   * the school's own fixture is not a person — and because a backend may have
   * rows that predate the column.
   */
  assignedBy?: string
  /**
   * When this assignment lapses, if it does.
   *
   * An acting head of department for one term is a real thing, and a role that
   * expires on its own beats one somebody has to remember to remove.
   */
  expiresAt?: string
  /**
   * Whether the lapse has been written to the access log yet.
   *
   * Not a fact about the grant — a fact about the bookkeeping, and it is a
   * column rather than a lookup for the same reason a job queue has one: the
   * sweep has to know what it has already done without reading the log back.
   * Cleared whenever the grant is re-issued, because a fresh expiry is a fresh
   * thing to report when its turn comes.
   */
  lapseRecorded?: boolean
}

const TABLE = 'profiles'

interface Database {
  profiles: Profile[]
  staff: StaffRecord[]
  designations: StaffDesignation[]
  roles: ProfileRole[]
  /** Which `access` fixture these rows came from — see `seedSignature`. */
  seed?: string
}

let db: Database | null = null

onTenantSwitch(() => {
  db = null
  index = null
})

/**
 * Turn a job title into a stable code — "Bus Driver" → `bus-driver`.
 *
 * The catalogue is seeded from the titles a school's own fixture uses, so the
 * list it starts with is the list it actually employs people under rather than
 * a guess shipped by the product. Anything else it wants, it adds.
 */
function designationCode(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const now = () => new Date().toISOString()

/**
 * A fingerprint of every fixture this table's rows are built from.
 *
 * Without it, adding a profile to a school's seed is invisible on any browser
 * that has run the app. Over the fixtures, never the live rows, so granting
 * somebody a role on the People screen does not reseed the table it was
 * granted in.
 *
 * It covers the roster and the faculty now, not just the `access` block. That
 * follows from the person columns moving here: correcting a student's name in
 * her school's folder reseeds `students`, and if this table did not notice,
 * the joined name would still be the old one — the exact staleness that
 * keeping one copy is meant to rule out. Guardians come in through
 * `familiesSignature`, since the guardians are derived from them.
 */
function signatureOf(): string {
  const fixtures = tenantFixtures()
  return seedSignature([
    fixtures.access ?? null,
    familiesSignature(),
    fixtures.students.map(student => [String(student.id), splitPerson(student).person]),
    fixtures.teachers.map(teacher => [String(teacher.id), splitPerson(teacher).person]),
  ])
}

/**
 * This school's people, from its own tables.
 *
 * ── The order matters ─────────────────────────────────────────────────
 * A profile row per person, built from the capacity tables: every student on
 * the roster, every teacher on the faculty list, every guardian the roster
 * produced, and every member of the office staff the school's `access` block
 * names. The same id in two of those lists is one person and one row — which
 * is how the teacher who is also a guardian comes out as one profile with two
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
  const school = tenantFixtures()
  const fixtures = school.access
  const families = deriveFamilies()

  // ── One row per person ──
  //
  // Read off the school's own fixtures rather than off the capacity tables.
  // Those tables now read their person columns from here, so asking them would
  // be asking a table that is waiting on this one. The fixtures are the seed
  // script and know everybody.
  const profiles: Profile[] = []
  const byId = new Map<string, Profile>()
  // First writer wins. The teacher whose child attends is reached twice — once
  // as faculty, once as a guardian — and her faculty record is the fuller one.
  const upsert = (id: string, person: Partial<Profile>) => {
    const existing = byId.get(id)
    if (existing) return existing
    const profile: Profile = { ...person, id, fullName: person.fullName ?? id }
    profiles.push(profile)
    byId.set(id, profile)
    return profile
  }

  school.students.forEach(student =>
    upsert(String(student.id), {
      ...splitPerson(student).person,
      fullName: getDisplayName(student),
    }),
  )
  school.teachers.forEach(teacher =>
    upsert(String(teacher.id), {
      ...splitPerson(teacher).person,
      fullName: teacher.fullName ?? teacher.displayName ?? teacher.teacherId,
    }),
  )
  families.guardians.forEach(guardian =>
    upsert(guardian.profileId, { fullName: guardian.fullName, primaryPhone: guardian.phone }),
  )

  // ── The employment records, and the logins ──
  const staff: StaffRecord[] = []
  const roles: ProfileRole[] = []

  // The catalogue, built from the titles this school's own seed names. A `Map`
  // so two people sharing a title share the row, which is the point of it
  // being a row at all.
  const designations = new Map<string, StaffDesignation>()
  const designationFor = (name: string): string => {
    const code = designationCode(name)
    if (!designations.has(code)) {
      designations.set(code, { id: `SD-${code}`, code, name: name.trim(), isActive: true })
    }
    return `SD-${code}`
  }

  // ── Every teacher is staff ──
  //
  // `teachers` extends `staff`, it does not sit beside it: a teacher is staff
  // who teach, and their employee number, department and joining date are
  // employment facts that every employee has. `teachers` keeps what is true
  // only of teaching — the qualification, the subject.
  //
  // Written here and before the `access` block, so a member of the office
  // staff who also teaches gets one row rather than two: `staff.profile_id` is
  // the primary key, and the upsert below finds this one.
  school.teachers.forEach(teacher => {
    staff.push({
      profileId: String(teacher.id),
      employeeId: teacher.teacherId,
      department: departmentOf(teacher.subject),
      designationId: designationFor('Teacher'),
    })
  })

  if (fixtures) {
    // A fixture entry refers to itself by `key`, because half of them do not
    // know their own profile id until this runs.
    const idByKey = new Map<string, string>()

    fixtures.profiles.forEach(entry => {
      let id = entry.id
      if (id === undefined && entry.guardianPhone !== undefined) {
        // The guardians off the roster minted this one, so the seed names the
        // number and we find the row.
        id = families.guardians.find(
          guardian => digitsOf(guardian.phone) === digitsOf(entry.guardianPhone),
        )?.profileId
      }
      if (id === undefined) return

      // A pure member of staff has no student, teacher or guardian record to
      // take a name from, so the seed carries one. `user_profiles` has name
      // columns in the schema for exactly this reason.
      const profile = upsert(id, {
        fullName: entry.fullName ?? entry.staff?.designation ?? id,
      })
      profile.userId = entry.userId
      if (entry.assignedClasses) profile.assignedClasses = [...entry.assignedClasses]
      idByKey.set(entry.key, id)

      if (entry.staff) {
        // Upsert: `staff.profile_id` is the primary key, so the teacher who is
        // also named in the access block is one employment record with the
        // fixture's details written over the derived ones.
        const existing = staff.find(row => row.profileId === id)
        const record: StaffRecord = {
          profileId: id,
          employeeId: entry.staff.employeeId,
          designationId: entry.staff.designation
            ? designationFor(entry.staff.designation)
            : existing?.designationId,
          department: entry.staff.department ?? existing?.department,
        }
        if (existing) Object.assign(existing, record)
        else staff.push(record)
      }
    })

    // A `parent` role on somebody with no guardian record here would scope to no
    // children and read as a permissions bug rather than as missing data.
    const hasGuardianRecord = (id: string) =>
      families.guardians.some(guardian => guardian.profileId === id)

    fixtures.roles.forEach(row => {
      const profileId = idByKey.get(row.key)
      if (!profileId) return
      if (row.roleId === 'parent' && !hasGuardianRecord(profileId)) return
      roles.push({ profileId, roleId: row.roleId, assignedAt: now(), expiresAt: row.expiresAt })
    })

  }

  return {
    profiles,
    staff,
    designations: [...designations.values()],
    roles,
    seed: signatureOf(),
  }
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
        Array.isArray(parsed.designations) &&
        Array.isArray(parsed.roles) &&
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
  index = null
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
 * The person columns for one profile, for a capacity store to join onto its row.
 *
 * Returns an empty object rather than undefined for a profile that is not
 * here: a student row without a profile is a broken seed, and a directory that
 * renders her with a blank name is easier to see and to fix than one that
 * throws on the first row.
 */
export function personOf(profileId: string): Partial<Profile> {
  const found = personIndex().get(String(profileId))
  if (!found) return {}
  const { assignedClasses: _classes, isDeleted: _deleted, id: _id, ...person } = found
  return person
}

/**
 * An id index, because the join is per row.
 *
 * `listStudents()` asks this 441 times for one directory, and the dashboards
 * ask for the directory several times a render. Scanning 1,129 profiles each
 * time is half a million comparisons for one screen. Dropped by `persist`, so
 * a write is never read back stale.
 */
let index: Map<string, Profile> | null = null
function personIndex(): Map<string, Profile> {
  if (index) return index
  index = new Map(load().profiles.map(row => [row.id, row]))
  return index
}

/**
 * Write the person half of a capacity record.
 *
 * Creating a student now writes two rows, the way it would against the real
 * schema. The profile comes first, because the capacity row's primary key is
 * the profile's id.
 *
 * ── The write-through ─────────────────────────────────────────────────
 * This table is a read replica for anybody who holds a login: the truth about
 * them is `GlobalDB.user_profiles`, and a value written only here would be
 * overwritten by the next sync — silently, and at whatever moment somebody
 * signed in. So a write that touches a replicated column on a profile with a
 * `user_id` goes upstream first, and this row takes the same value.
 *
 * It happens here rather than in a service because every person-write in the
 * app funnels through this function, which is the reason the split put it
 * here. `fromSync` is how the sync itself avoids bouncing back. The column
 * list is imported from `global/profiles` rather than restated, so "what the
 * replica may not own" has exactly one definition.
 *
 * For the 1,124 people with no login there is no upstream row and nothing to
 * do — this table *is* their truth, which is the whole difference between the
 * two tables.
 */
export function upsertPerson(
  profileId: string,
  person: Partial<Profile>,
  options: { fromSync?: boolean } = {},
): void {
  const database = load()
  const existing = database.profiles.find(row => row.id === String(profileId))

  if (!options.fromSync && existing?.userId) {
    const upstream: Record<string, unknown> = {}
    REPLICATED_COLUMNS.forEach(column => {
      if (column in person) upstream[column] = person[column]
    })
    if (Object.keys(upstream).length > 0) updateGlobalProfile(existing.userId, upstream)
  }

  if (existing) Object.assign(existing, person)
  else
    database.profiles.push({
      ...person,
      id: String(profileId),
      fullName: person.fullName ?? String(profileId),
    })
  persist()
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

/**
 * The job title this person is employed under, if they are staff at all.
 *
 * Singular where `typesOf` was plural, and that is the change: what somebody
 * *is* here is which capacity tables hold their id, which `capacitiesOf`
 * derives. This answers only what their job is called.
 */
export function designationOf(profileId: string): StaffDesignation | undefined {
  const database = load()
  const record = database.staff.find(row => row.profileId === profileId)
  if (!record?.designationId) return undefined
  const found = database.designations.find(row => row.id === record.designationId)
  return found ? { ...found } : undefined
}

/** The catalogue — what a picker offers, and what reporting groups by. */
export function listDesignations(): StaffDesignation[] {
  return load().designations.map(row => ({ ...row }))
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
 * Which, now that every student, teacher and guardian already has one, means
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
/**
 * Give somebody a role, optionally until a date.
 *
 * Idempotent on the pair, as `PRIMARY KEY (profile_id, role_id)` requires — so
 * re-granting is how an expiry is changed or lifted, and `expiresAt` is
 * written on both paths rather than only on insert. Passing `undefined` makes
 * a temporary role permanent, which is the button a school needs when the
 * acting head turns out to be staying.
 *
 * `assignedBy` is the granter's profile id. Absent for the seed, which has
 * nobody to name.
 */
export function grantRole(
  profileId: string,
  roleId: string,
  options: { expiresAt?: string; assignedBy?: string } = {},
): void {
  const database = load()
  const existing = database.roles.find(
    row => row.profileId === profileId && row.roleId === roleId,
  )
  if (existing) {
    existing.expiresAt = options.expiresAt
    if (options.assignedBy !== undefined) existing.assignedBy = options.assignedBy
    // A new expiry is a new lapse to report. Leaving the flag set would mean
    // extending a role that had already run out silently used up its one line
    // in the log, and the second ending would never be recorded.
    delete existing.lapseRecorded
    // Re-stamped: an expiry lifted or extended is a new decision by a new
    // person, and dating it to the original grant would credit the wrong one.
    existing.assignedAt = now()
  } else {
    database.roles.push({
      profileId,
      roleId,
      assignedAt: now(),
      expiresAt: options.expiresAt,
      assignedBy: options.assignedBy,
    })
  }
  persist()
}

/**
 * Every role this person holds here, with how it got there.
 *
 * `roleIdsOf` answers what they may do and is what the ability builder wants.
 * This answers where it came from, which is what a People screen shows and
 * what somebody asks six months later. Expired assignments are excluded from
 * both — an expired role is not a role.
 */
export function roleGrantsOf(profileId: string): ProfileRole[] {
  return liveRoles(load().roles)
    .filter(row => row.profileId === profileId)
    .map(row => ({ ...row }))
}

/**
 * Grants whose date has passed and that nothing has reported yet.
 *
 * A backend would sweep this on a schedule and write the audit rows from a
 * job. There is no scheduler in a browser, so it is swept when somebody reads
 * the access log — which is the only place the answer is shown, and so the
 * only place the difference is observable. Either way the entry is dated to
 * `expiresAt`, not to the sweep: the role ended when it ended.
 *
 * Read and mark are separate calls so the caller can write the log *before*
 * marking. It is the right way round for a record: if something fails in
 * between, the failure mode is a line written twice rather than an ending that
 * was never written down.
 */
export function lapsedGrants(): ProfileRole[] {
  const stamp = now()
  return load()
    .roles.filter(
      row => row.expiresAt !== undefined && row.expiresAt <= stamp && !row.lapseRecorded,
    )
    .map(row => ({ ...row }))
}

/** Tick off the lapses that have been reported. Idempotent, as a sweep must be. */
export function markLapsesRecorded(rows: { profileId: string; roleId: string }[]): void {
  if (rows.length === 0) return
  const database = load()
  const done = new Set(rows.map(row => `${row.profileId}:${row.roleId}`))
  database.roles.forEach(row => {
    if (done.has(`${row.profileId}:${row.roleId}`)) row.lapseRecorded = true
  })
  persist()
}

export function revokeRole(profileId: string, roleId: string): void {
  const database = load()
  database.roles = database.roles.filter(
    row => !(row.profileId === profileId && row.roleId === roleId),
  )
  persist()
}

/**
 * Add a job title to this school's catalogue.
 *
 * Refuses a duplicate code rather than minting a second row for the same
 * title, which is what a free-text field could not do and the reason this is a
 * table: "Bus Driver" typed twice has to be one thing or reporting by it means
 * nothing.
 */
export function createDesignation(input: { code: string; name: string }): StaffDesignation | null {
  const database = load()
  const code = designationCode(input.code)
  if (!code || database.designations.some(row => row.code === code)) return null

  const designation: StaffDesignation = {
    id: newId('SD'),
    code,
    name: input.name.trim() || code,
    isActive: true,
  }
  database.designations.push(designation)
  persist()
  return { ...designation }
}

/**
 * Retire a title.
 *
 * Deactivated rather than deleted, because staff rows point at it: a school
 * that outsources its transport stops offering "Bus Driver" to new starters
 * while everyone who held it keeps a job title. That is what `ON DELETE
 * RESTRICT` buys in the schema, expressed as a flag a school can set.
 */
export function deactivateDesignation(id: string): boolean {
  const database = load()
  const designation = database.designations.find(row => row.id === id)
  if (!designation) return false
  designation.isActive = false
  persist()
  return true
}

/** Set — or clear — the title on somebody's employment record. */
export function setDesignation(profileId: string, designationId: string | null): boolean {
  const database = load()
  const record = database.staff.find(row => row.profileId === profileId)
  if (!record) return false
  if (designationId !== null && !database.designations.some(row => row.id === designationId)) {
    return false
  }
  record.designationId = designationId ?? undefined
  persist()
  return true
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
  database.staff = database.staff.filter(row => row.profileId !== profileId)
  persist()
  return true
}

/**
 * Take a login off a profile, leaving the person.
 *
 * What "remove somebody from this school" means for anyone who is also a
 * student, a teacher or a guardian here: the account goes, the human stays on
 * the roster. `deleteProfile` is for a profile the school's own tables do not
 * otherwise know about — the office staff this seed created.
 */
export function detachLogin(profileId: string): boolean {
  const database = load()
  const profile = database.profiles.find(row => row.id === profileId)
  if (!profile) return false
  delete profile.userId
  database.roles = database.roles.filter(row => row.profileId !== profileId)
  // The employment record stays. A title is a fact about the person's job, not
  // about their account — taking the login away does not un-employ them.
  persist()
  return true
}
