/**
 * The mock parent directory, and who each parent belongs to.
 *
 * Two tables, named after the backend's: `parents` extends a profile, and
 * `student_parents` links it to students with a relationship and a primary
 * flag. Both already exist in `develop/user-management`; this catches the mock
 * up rather than inventing a shape the backend will have to reconcile.
 *
 * ── Why a table at all ──────────────────────────────────────────────────
 * A guardian was three optional strings embedded on a student record —
 * `{ name, phone, relation }` under `father`, `mother` or
 * `alternativeGuardian`. That is fine for "who do we ring", and useless for
 * "who can sign in": no id, so nothing can point at them; and no link, so the
 * same person on two children's records is two unrelated strings. A parent
 * with two children must be one account that sees both.
 *
 * The embedded fields were kept for a while as "the contact details on the
 * record". They are gone now: the student form reads and writes this table
 * through `reconcileGuardians`, and nothing else read them. What survives of
 * them is `seed()` below, which is this mock's equivalent of a migration —
 * the fixture students still carry the old shape, and first run turns it into
 * rows.
 *
 * ── Seeding, and what it cannot do ─────────────────────────────────────
 * First run reads the embedded guardians and matches them across students on
 * name and phone, so siblings share one parent row. What it cannot invent is
 * an email: the contact details carry a phone and nothing else, and an account
 * needs an address to sign in with. So a seeded parent has `email: null` and
 * is not provisionable until a human supplies one — which is a real state the
 * People screen has to show, not an error to hide.
 */

import { newId } from '@/mocks/_shared'
import { listStudents } from '@/mocks/students'

export interface Parent {
  /** Profile id — the schema's `parents.profile_id`. */
  profileId: string
  fullName: string
  /**
   * Null until someone supplies one.
   *
   * Sign-in resolves an account by email, so a parent without one cannot have
   * an account. Null rather than an empty string so "never had one" is
   * distinguishable from "cleared it".
   */
  email: string | null
  phone?: string
  occupation?: string
  workplace?: string
}

/** One parent's link to one student. The schema's `student_parents`. */
export interface StudentParent {
  id: string
  studentProfileId: string
  parentProfileId: string
  /** 'Father', 'Mother', 'Guardian' — free text, as in the schema. */
  relationship: string
  /** The one the school rings first. At most one per student. */
  isPrimary: boolean
}

const DB_KEY = 'sanketa:mock-db:parents'

interface Database {
  parents: Parent[]
  links: StudentParent[]
}

let db: Database | null = null

/** Same person? Name and phone together, both loosely compared. */
function sameHuman(a: { fullName: string; phone?: string }, b: { fullName: string; phone?: string }) {
  const name = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  const digits = (value?: string) => (value ?? '').replace(/\D/g, '').slice(-10)
  if (name(a.fullName) !== name(b.fullName)) return false
  // A shared name with no phone on either side is a guess, not a match — two
  // families can hold the same name. A shared name and a shared number is not.
  if (!digits(a.phone) || !digits(b.phone)) return false
  return digits(a.phone) === digits(b.phone)
}

function seed(): Database {
  const parents: Parent[] = []
  const links: StudentParent[] = []
  let sequence = 0

  listStudents().forEach(student => {
    const guardians = student.guardians
    if (!guardians) return

    const entries: { relationship: string; name?: string; phone?: string }[] = [
      { relationship: 'Father', name: guardians.father?.name, phone: guardians.father?.phone },
      { relationship: 'Mother', name: guardians.mother?.name, phone: guardians.mother?.phone },
      {
        relationship: guardians.alternativeGuardian?.relation || 'Guardian',
        name: guardians.alternativeGuardian?.name,
        phone: guardians.alternativeGuardian?.phone,
      },
    ]

    let primaryTaken = false
    entries.forEach(entry => {
      if (!entry.name?.trim()) return
      const candidate = { fullName: entry.name.trim(), phone: entry.phone }

      let parent = parents.find(existing => sameHuman(existing, candidate))
      if (!parent) {
        sequence += 1
        parent = {
          profileId: `P-${String(2000 + sequence)}`,
          fullName: candidate.fullName,
          email: null,
          phone: candidate.phone,
        }
        parents.push(parent)
      }

      links.push({
        id: `SP-${links.length + 1}`,
        studentProfileId: String(student.id),
        parentProfileId: parent.profileId,
        relationship: entry.relationship,
        isPrimary: !primaryTaken,
      })
      primaryTaken = true
    })
  })

  return { parents, links }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.parents) && Array.isArray(parsed.links)) {
        db = parsed
        // The cascade a real `student_parents` FK would do for free. The
        // student directory reseeds itself whenever its fixtures are edited,
        // and this table survives that, so links to students who went with the
        // reseed have to go too. Left in place they are invisible — a parent's
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
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

const cloneParent = (parent: Parent): Parent => ({ ...parent })
const cloneLink = (link: StudentParent): StudentParent => ({ ...link })

// ── Reads ─────────────────────────────────────────────────────────────

export function listParents(): Parent[] {
  return load().parents.map(cloneParent)
}

export function listLinks(): StudentParent[] {
  return load().links.map(cloneLink)
}

/** The parents of one student, with the relationship each holds. */
export function parentsOfStudent(studentProfileId: string): (Parent & { relationship: string; isPrimary: boolean })[] {
  const database = load()
  return database.links
    .filter(link => link.studentProfileId === studentProfileId)
    .flatMap(link => {
      const parent = database.parents.find(row => row.profileId === link.parentProfileId)
      return parent
        ? [{ ...parent, relationship: link.relationship, isPrimary: link.isPrimary }]
        : []
    })
}

/**
 * The students one parent covers.
 *
 * This is the list a parent account's scope is built from — the reason the
 * link table exists rather than a field on the student.
 */
export function studentsOfParent(parentProfileId: string): string[] {
  return load()
    .links.filter(link => link.parentProfileId === parentProfileId)
    .map(link => link.studentProfileId)
}

// ── Writes ────────────────────────────────────────────────────────────

export function createParent(input: {
  fullName: string
  email?: string | null
  phone?: string
}): Parent {
  const database = load()
  const parent: Parent = {
    profileId: newId('P'),
    fullName: input.fullName.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || undefined,
  }
  database.parents.push(parent)
  persist()
  return cloneParent(parent)
}

export function updateParent(
  profileId: string,
  patch: { fullName?: string; email?: string | null; phone?: string },
): Parent | null {
  const database = load()
  const parent = database.parents.find(row => row.profileId === profileId)
  if (!parent) return null

  if (patch.fullName !== undefined) parent.fullName = patch.fullName.trim()
  if (patch.email !== undefined) parent.email = patch.email?.trim() || null
  if (patch.phone !== undefined) parent.phone = patch.phone.trim() || undefined

  persist()
  return cloneParent(parent)
}

/**
 * Link a parent to a student.
 *
 * Idempotent on the pair, because the schema has `UNIQUE(student, parent)` and
 * a screen that links twice should be a no-op rather than a duplicate row.
 */
export function linkParent(input: {
  studentProfileId: string
  parentProfileId: string
  relationship: string
  isPrimary?: boolean
}): StudentParent | null {
  const database = load()
  if (!database.parents.some(row => row.profileId === input.parentProfileId)) return null

  const existing = database.links.find(
    link =>
      link.studentProfileId === input.studentProfileId &&
      link.parentProfileId === input.parentProfileId,
  )
  const link = existing ?? {
    id: newId('SP'),
    studentProfileId: input.studentProfileId,
    parentProfileId: input.parentProfileId,
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
 * account can be attached to, that a sibling shares, and that a parent's
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
 * them are blank because nobody filled them in — and unlinking a parent can
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
  const claim = (matches: (link: StudentParent) => boolean) => {
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
      updateParent(existing.parentProfileId, { fullName, phone: slot.phone })
      existing.relationship = slot.relationship
      persist()
      return
    }

    const candidate = { fullName, phone: slot.phone }
    const parent =
      database.parents.find(row => sameHuman(row, candidate)) ??
      createParent({ fullName, phone: slot.phone })

    linkParent({
      studentProfileId: studentId,
      parentProfileId: parent.profileId,
      relationship: slot.relationship,
      // The school rings somebody first, and on a record that names nobody yet
      // that is whoever was entered first. Never moved off a parent who
      // already holds it, since the form has no field that asks.
      isPrimary: !mine().some(link => link.isPrimary),
    })
  })
}

export function unlinkParent(studentProfileId: string, parentProfileId: string): boolean {
  const database = load()
  const index = database.links.findIndex(
    link =>
      link.studentProfileId === studentProfileId && link.parentProfileId === parentProfileId,
  )
  if (index === -1) return false
  database.links.splice(index, 1)
  persist()
  return true
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetParents(): void {
  db = seed()
  persist()
}
