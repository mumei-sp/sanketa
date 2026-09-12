/**
 * The student directory.
 *
 * A mock-backed table like the others: rows with ids, reads and writes through
 * functions, `localStorage` as its disk. Nothing in `src/features/` should
 * touch the key — the way in and out is `student-service.ts`, exactly as the
 * only way into a real table is the API.
 *
 * ── Why reads hand back copies ─────────────────────────────────────────
 * `listStudents` and `findStudent` clone. That is the whole difference
 * between a table and a shared array: while this was an exported
 * `studentsData`, promotion moved a class by writing `student.gradeLevel` on
 * objects it had found, and nothing had to tell the store it had happened —
 * which is why the directory went so long without surviving a reload and
 * nobody noticed. Now a caller that wants to change a student has to say so,
 * and saying so is what writes to disk.
 *
 * ── Reseeding ──────────────────────────────────────────────────────────
 * The fixtures are fingerprinted and the fingerprint stored with the rows, so
 * editing a school's roster reseeds instead of being silently ignored — see
 * `_shared/seed-signature.ts`, which the other reseeding stores share.
 *
 * The seed comes from the *active school's* folder, so the fingerprint is
 * that school's too — editing Vidya Mandir's roster must not reseed Kendriya's.
 */

import type { Student } from '@/features/students/types'
import { tenantFixtures } from '@/mocks/schools'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import type { CapacityRow } from '@/mocks/tenant/profiles/store'
import { splitPerson, personOf, upsertPerson } from '@/mocks/tenant/profiles/store'

const TABLE = 'students'

/**
 * What this table stores: the `students` columns, and nothing about the person.
 *
 * Her name, her date of birth and the number she answers are `user_profiles`
 * columns and live there — one copy, however many schools she attends. What is
 * here is what is true of her *at this school*: an admission number, a roll
 * number, a section.
 *
 * `id` stays on the row. It is the profile's id, not a second key: the schema
 * gives `students` `profile_id` as its own primary key.
 */
export type StudentRow = CapacityRow<Student>

interface Database {
  rows: StudentRow[]
  /** Which fixture list these rows were seeded from. See `signatureOf`. */
  seed: string
}

let db: Database | null = null

// These rows belong to one school; the key says which. Dropping the cached
// copy on a switch is what stops the last school's rows being served as this
// one's — see `tenant-context`.
onTenantSwitch(() => {
  db = null
})

function seed(): Database {
  const fixtures = tenantFixtures().students
  // The fixtures are authored as whole people — a name and a roll number side
  // by side, which is the readable way to write a seed. Splitting is what
  // makes them two rows; the profiles store seeds the other half from the same
  // fixtures, so neither has to wait on the other.
  return {
    rows: fixtures.map(student => splitPerson(student).row),
    seed: seedSignature(fixtures),
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      // An empty array is not a school. A stored file that says so is a
      // half-written one, and reseeding beats showing a directory of nobody.
      // A fingerprint that no longer matches means the fixtures were edited
      // since this was written, and the edit is the newer intent — the same
      // bargain as re-running a seed script.
      if (
        Array.isArray(parsed.rows) &&
        parsed.rows.length > 0 &&
        parsed.seed === seedSignature(tenantFixtures().students)
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

/**
 * Row plus person — what every caller of this module means by "a student".
 *
 * The row wins on a key they share, which is only `id`, and they agree on it.
 */
const join = (row: StudentRow): Student => ({ ...personOf(String(row.id)), ...row }) as Student

/** Ids are `string | number` on the record, so never compare them raw. */
const sameId = (a: Student['id'], b: string | number) => String(a) === String(b)

// ── Reads ─────────────────────────────────────────────────────────────

export function listStudents(): Student[] {
  return load().rows.map(join)
}

/**
 * How many are enrolled.
 *
 * Its own function because the three dashboards that want it want only this,
 * and cloning forty records to read `.length` off them would be a silly way
 * to pay for the encapsulation.
 */
export function studentCount(): number {
  return load().rows.length
}

/** By profile id — the `id` a scope and a `student_guardians` link both hold. */
export function findStudent(id: string | number): Student | undefined {
  const found = load().rows.find(row => sameId(row.id, id))
  return found ? join(found) : undefined
}

/**
 * By the human code printed on things — `S-2101`.
 *
 * The second key a student record carries, and the one the fee tables and
 * receipts join on, because that is the number a parent reads out.
 */
export function findStudentByCode(studentId: string): Student | undefined {
  const found = load().rows.find(row => row.studentId === studentId)
  return found ? join(found) : undefined
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * Newest first, which is the order the directory is read in.
 *
 * Two rows, as it would be against the real schema: the profile first, because
 * the student row's primary key is the profile's id.
 */
export function insertStudent(student: Student): Student {
  const { person, row } = splitPerson(student)
  upsertPerson(String(student.id), person)
  load().rows.unshift(row)
  persist()
  return join(row)
}

/** Replace one row wholesale. Returns null if there is nothing to replace. */
export function replaceStudent(id: string | number, next: Student): Student | null {
  const database = load()
  const index = database.rows.findIndex(row => sameId(row.id, id))
  if (index === -1) return null
  const { person, row } = splitPerson(next)
  upsertPerson(String(id), person)
  database.rows[index] = row
  persist()
  return join(row)
}

/**
 * Merge changes into several rows at once.
 *
 * A batch rather than a loop of single patches because promotion moves a
 * class at a time, and writing the directory out per student would serialise
 * forty rows forty times for one button. Rows named in `entries` that do not
 * exist are skipped rather than created.
 */
export function patchStudents(
  entries: { id: string | number; patch: Partial<Student> }[],
): void {
  const database = load()
  let changed = false
  entries.forEach(({ id, patch }) => {
    const index = database.rows.findIndex(row => sameId(row.id, id))
    if (index === -1) return
    // A patch arrives as a slice of a student and may touch either table —
    // renaming her is a profile write, moving her a class is a student one.
    const { person, row } = splitPerson(patch)
    if (Object.keys(person).length > 0) upsertPerson(String(id), person)
    database.rows[index] = { ...database.rows[index], ...row }
    changed = true
  })
  if (changed) persist()
}
