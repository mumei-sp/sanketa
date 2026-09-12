/**
 * The mock guardian directory, and who each guardian belongs to.
 *
 * Two tables, named after the backend's: `guardians` extends a profile, and
 * `student_parents` links it to students with a relationship and a primary
 * flag. Both already exist in `develop/user-management`; this catches the mock
 * up rather than inventing a shape the backend will have to reconcile.
 *
 * ── Why a table at all ──────────────────────────────────────────────────
 * A guardian was three optional strings embedded on a student record —
 * `{ name, phone, relation }` under `father`, `mother` or
 * `alternativeGuardian`. That is fine for "who do we ring", and useless for
 * "who can sign in": no id, so nothing can point at them; and no link, so the
 * same person on two children's records is two unrelated strings. A guardian
 * with two children must be one account that sees both.
 *
 * The embedded fields were kept for a while as "the contact details on the
 * record". They are gone now: the student form reads and writes this table
 * through `reconcileGuardians`, and nothing else read them. What survives of
 * them is `seed()` below, which is this mock's equivalent of a migration —
 * the fixture students still carry the old shape, and first run turns it into
 * rows.
 *
 * ── Seeding ────────────────────────────────────────────────────────────
 * First run reads the embedded guardians and matches them across students on
 * name and phone, so siblings share one guardian row. What it cannot invent is
 * an email — the contact details carry a phone and a relationship, nothing
 * else — so a seeded guardian has `email: null`. That used to mean they could
 * not be given an account; sign-in takes a number now, so the phone the school
 * already has is enough, and `email: null` is just a missing address.
 */

import { newId } from '@/mocks/_shared'
import { listStudents } from '@/mocks/tenant/students/store'
import { personOf, upsertPerson } from '@/mocks/tenant/profiles/store'
import { deriveFamilies, familiesSignature, sameHuman } from './derive'
import type { StudentGuardian } from './derive'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'

export type { StudentGuardian } from './derive'

/**
 * A guardian, as every caller means it — the `guardians` row joined to the person.
 *
 * Only `profileId`, `email`, `occupation` and `workplace` are stored here. The
 * name and the number are `user_profiles` columns and live there, which is
 * what makes the guardian of a child at two schools one name rather than two.
 */
export interface Guardian {
  /** Profile id — the schema's `guardians.profile_id`. */
  profileId: string
  /** From `user_profiles.full_name`. */
  fullName: string
  /**
   * Null until someone supplies one, which for most guardians is never.
   *
   * Not a blocker for an account any more — sign-in takes the mobile number
   * the school already holds. It matters for the second guardian on a shared
   * family number, who needs an address of their own because a number belongs
   * to one account. Null rather than an empty string so "never had one" is
   * distinguishable from "cleared it".
   */
  email: string | null
  /** From `user_profiles.primary_phone`. */
  phone?: string
  occupation?: string
  workplace?: string
}

/** What the `guardians` table actually stores. The rest is the person. */
export type GuardianRow = Omit<Guardian, 'fullName' | 'phone'>

const TABLE = 'guardians'

interface Database {
  guardians: GuardianRow[]
  links: StudentGuardian[]
  /**
   * Which roster these rows were derived from. See `familiesSignature`.
   *
   * Absent on a file written before this existed, which reads as "does not
   * match" and reseeds — the right answer, since the rosters changed.
   */
  seed?: string
}

let db: Database | null = null

// These rows belong to one school; the key says which. Dropping the cached
// copy on a switch is what stops the last school's rows being served as this
// one's — see `tenant-context`.
onTenantSwitch(() => {
  db = null
})

function seed(): Database {
  // The derivation lives in `derive.ts`, because the profiles store runs it
  // too: it has to know every person at the school, guardians included, before
  // this table exists. Here it becomes `guardians` rows; there it becomes the
  // name and the number on each profile.
  const { guardians, links } = deriveFamilies()
  return {
    guardians: guardians.map(guardian => ({ profileId: guardian.profileId, email: null })),
    links,
    seed: familiesSignature(),
  }
}

/**
 * Drop what this table used to be called.
 *
 * The rows moved to `guardians` and the old key is orphaned — nothing reads
 * it, and it is a quarter of a megabyte per browser that has ever run the app,
 * sitting under a name that looks like a live table to anyone opening
 * devtools. A real rename migration drops the old table; this is that.
 *
 * Safe to delete from this file once no browser can still be holding one.
 */
function dropRenamedTable(): void {
  try {
    localStorage.removeItem(tenantKey('parents'))
  } catch {
    // Unavailable in private mode; there was nothing to drop either.
  }
}

function load(): Database {
  if (db) return db
  dropRenamedTable()
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (
        Array.isArray(parsed.guardians) &&
        Array.isArray(parsed.links) &&
        parsed.seed === familiesSignature()
      ) {
        db = parsed
        // The cascade a real `student_parents` FK would do for free. The
        // student directory reseeds itself whenever its fixtures are edited,
        // and this table survives that, so links to students who went with the
        // reseed have to go too. Left in place they are invisible — a guardian's
        // scope lists an id nothing resolves — right up until something counts
        // children rather than resolving them.
        const known = new Set(listStudents().map(student => String(student.id)))
        const live = db.links.filter(link => known.has(String(link.studentProfileId)))
        if (live.length !== db.links.length) {
          db.links = live
          persist()
        }
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

/**
 * Row plus person.
 *
 * `fullName` and `phone` are not on the row any more — they are
 * `user_profiles.full_name` and `user_profiles.primary_phone`, which is why
 * the join renames as it goes rather than spreading.
 */
const cloneGuardian = (guardian: GuardianRow): Guardian => {
  const person = personOf(guardian.profileId)
  return {
    ...guardian,
    fullName: person.fullName ?? guardian.profileId,
    phone: person.primaryPhone,
  }
}
const cloneLink = (link: StudentGuardian): StudentGuardian => ({ ...link })

// ── Reads ─────────────────────────────────────────────────────────────

export function listGuardians(): Guardian[] {
  return load().guardians.map(cloneGuardian)
}

export function listLinks(): StudentGuardian[] {
  return load().links.map(cloneLink)
}

/** One guardian by their profile id — `user_profiles.id` at this school. */
export function findGuardian(profileId: string): Guardian | undefined {
  const found = load().guardians.find(row => row.profileId === profileId)
  return found ? cloneGuardian(found) : undefined
}

/** The guardians of one student, with the relationship each holds. */
export function guardiansOfStudent(studentProfileId: string): (Guardian & { relationship: string; isPrimary: boolean })[] {
  const database = load()
  return database.links
    .filter(link => link.studentProfileId === studentProfileId)
    .flatMap(link => {
      const guardian = database.guardians.find(row => row.profileId === link.guardianProfileId)
      return guardian
        ? [{ ...cloneGuardian(guardian), relationship: link.relationship, isPrimary: link.isPrimary }]
        : []
    })
}

/**
 * The students one guardian covers.
 *
 * This is the list a guardian account's scope is built from — the reason the
 * link table exists rather than a field on the student.
 */
export function studentsOfGuardian(guardianProfileId: string): string[] {
  return load()
    .links.filter(link => link.guardianProfileId === guardianProfileId)
    .map(link => link.studentProfileId)
}

// ── Writes ────────────────────────────────────────────────────────────

/** Two rows: the profile carries who they are, `guardians` that they are one. */
export function createGuardian(input: {
  fullName: string
  email?: string | null
  phone?: string
}): Guardian {
  const database = load()
  const guardian: GuardianRow = { profileId: newId('G'), email: input.email?.trim() || null }
  upsertPerson(guardian.profileId, {
    fullName: input.fullName.trim(),
    primaryPhone: input.phone?.trim() || undefined,
  })
  database.guardians.push(guardian)
  persist()
  return cloneGuardian(guardian)
}

export function updateGuardian(
  profileId: string,
  patch: { fullName?: string; email?: string | null; phone?: string },
): Guardian | null {
  const database = load()
  const guardian = database.guardians.find(row => row.profileId === profileId)
  if (!guardian) return null

  // Correcting a guardian's name is a write to `user_profiles`, and correcting
  // the address the school has for them is a write to `guardians`.
  const person: { fullName?: string; primaryPhone?: string } = {}
  if (patch.fullName !== undefined) person.fullName = patch.fullName.trim()
  if (patch.phone !== undefined) person.primaryPhone = patch.phone.trim() || undefined
  if (Object.keys(person).length > 0) upsertPerson(profileId, person)

  if (patch.email !== undefined) guardian.email = patch.email?.trim() || null

  persist()
  return cloneGuardian(guardian)
}

/**
 * Link a guardian to a student.
 *
 * Idempotent on the pair, because the schema has `UNIQUE(student, guardian)` and
 * a screen that links twice should be a no-op rather than a duplicate row.
 */
export function linkGuardian(input: {
  studentProfileId: string
  guardianProfileId: string
  relationship: string
  isPrimary?: boolean
}): StudentGuardian | null {
  const database = load()
  if (!database.guardians.some(row => row.profileId === input.guardianProfileId)) return null

  const existing = database.links.find(
    link =>
      link.studentProfileId === input.studentProfileId &&
      link.guardianProfileId === input.guardianProfileId,
  )
  const link = existing ?? {
    id: newId('SG'),
    studentProfileId: input.studentProfileId,
    guardianProfileId: input.guardianProfileId,
    relationship: input.relationship,
    isPrimary: false,
  }
  link.relationship = input.relationship

  if (input.isPrimary) {
    // At most one primary per student, so promoting one demotes the rest.
    database.links
      .filter(other => other.studentProfileId === input.studentProfileId)
      .forEach(other => {
        other.isPrimary = false
      })
    link.isPrimary = true
  }

  if (!existing) database.links.push(link)
  persist()
  return cloneLink(link)
}

/** One slot of the student form's guardian section. */
export interface GuardianSlot {
  name?: string
  /** Already joined with its dialling code — see `joinPhone`. */
  phone?: string
  relationship: string
}

/**
 * Bring this student's guardian links in line with what the student form says.
 *
 * The form has three slots — father, mother, one alternative — holding a name
 * and a phone and no id. This is what turns them into people: the rows that an
 * account can be attached to, that a sibling shares, and that a guardian's
 * `studentIds` scope is built from. Without it a school could type a father's
 * name on the enrolment form and find, later, that he cannot be given an
 * account because nothing in the directory knows he exists.
 *
 * ── Which row a slot means ─────────────────────────────────────────────
 * A slot carries no id, so the row it refers to has to be inferred, and the
 * obvious rule — match on the name — is the wrong one: correcting a typo in a
 * father's name would then read as a different father and enrol a second one.
 * So a slot claims this student's existing link of the same kind (Father,
 * Mother, or the first that is neither), and edits the person behind it. Only
 * a slot with no link of its kind looks further afield, and there it does
 * match on the person — that is the sibling case, where the same father typed
 * on a second child's form must be the same row and not a twin.
 *
 * ── What it will not do ────────────────────────────────────────────────
 * Emptying a slot does not unlink. A blank field is not a decision — most of
 * them are blank because nobody filled them in — and unlinking a guardian can
 * take away their access to their child. Removing a guardian is done on the
 * detail page, where the button says so.
 */
export function reconcileGuardians(studentProfileId: string, slots: GuardianSlot[]): void {
  const database = load()
  const studentId = String(studentProfileId)
  const mine = () => database.links.filter(link => link.studentProfileId === studentId)

  // Claimed as we go, so two slots cannot both take the same link — an
  // alternative guardian recorded as 'Father' would otherwise be claimed by
  // the father slot and then again by the alternative one.
  const claimed = new Set<string>()
  const claim = (matches: (link: StudentGuardian) => boolean) => {
    const link = mine().find(candidate => !claimed.has(candidate.id) && matches(candidate))
    if (link) claimed.add(link.id)
    return link
  }

  slots.forEach(slot => {
    const fullName = slot.name?.trim()
    const isNamedRole = slot.relationship === 'Father' || slot.relationship === 'Mother'
    const existing = claim(link =>
      isNamedRole
        ? link.relationship === slot.relationship
        : link.relationship !== 'Father' && link.relationship !== 'Mother',
    )

    if (!fullName) return

    if (existing) {
      updateGuardian(existing.guardianProfileId, { fullName, phone: slot.phone })
      existing.relationship = slot.relationship
      persist()
      return
    }

    const candidate = { fullName, phone: slot.phone }
    const guardian =
      database.guardians.map(cloneGuardian).find(row => sameHuman(row, candidate)) ??
      createGuardian({ fullName, phone: slot.phone })

    linkGuardian({
      studentProfileId: studentId,
      guardianProfileId: guardian.profileId,
      relationship: slot.relationship,
      // The school rings somebody first, and on a record that names nobody yet
      // that is whoever was entered first. Never moved off a guardian who
      // already holds it, since the form has no field that asks.
      isPrimary: !mine().some(link => link.isPrimary),
    })
  })
}

export function unlinkGuardian(studentProfileId: string, guardianProfileId: string): boolean {
  const database = load()
  const index = database.links.findIndex(
    link =>
      link.studentProfileId === studentProfileId && link.guardianProfileId === guardianProfileId,
  )
  if (index === -1) return false
  database.links.splice(index, 1)
  persist()
  return true
}
