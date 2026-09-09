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
 * editing `students.ts` reseeds instead of being silently ignored. The other
 * tables have the opposite behaviour and it is tolerable there — nobody edits
 * the roles fixture twice a week — but the student directory is the fixture
 * people actually reach for, and a store that quietly serves last week's copy
 * of it costs an hour before anyone thinks to look in localStorage.
 */

import type { Student } from '@/features/students/types'
import { studentFixtures } from './students'

const DB_KEY = 'sanketa:mock-db:students'

interface Database {
  rows: Student[]
  /** Which fixture list these rows were seeded from. See `signatureOf`. */
  seed: string
}

let db: Database | null = null

/**
 * A cheap fingerprint of the seed rows.
 *
 * A hash rather than a hand-bumped version number, because the version number
 * is the thing you forget to bump on exactly the change you needed it for.
 */
function signatureOf(fixtures: Student[]): string {
  const text = JSON.stringify(fixtures)
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  }
  return `${fixtures.length}:${hash}`
}

function seed(): Database {
  // Copies, so the fixture literal stays pristine and `resetStudents` has
  // something unmodified to put back.
  return {
    rows: studentFixtures.map(student => ({ ...student })),
    seed: signatureOf(studentFixtures),
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
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
        parsed.seed === signatureOf(studentFixtures)
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
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

const clone = (student: Student): Student => ({ ...student })

/** Ids are `string | number` on the record, so never compare them raw. */
const sameId = (a: Student['id'], b: string | number) => String(a) === String(b)

// ── Reads ─────────────────────────────────────────────────────────────

export function listStudents(): Student[] {
  return load().rows.map(clone)
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

/** By profile id — the `id` a scope and a `student_parents` link both hold. */
export function findStudent(id: string | number): Student | undefined {
  const found = load().rows.find(row => sameId(row.id, id))
  return found ? clone(found) : undefined
}

/**
 * By the human code printed on things — `S-2101`.
 *
 * The second key a student record carries, and the one the fee tables and
 * receipts join on, because that is the number a parent reads out.
 */
export function findStudentByCode(studentId: string): Student | undefined {
  const found = load().rows.find(row => row.studentId === studentId)
  return found ? clone(found) : undefined
}

// ── Writes ────────────────────────────────────────────────────────────

/** Newest first, which is the order the directory is read in. */
export function insertStudent(student: Student): Student {
  load().rows.unshift(student)
  persist()
  return clone(student)
}

/** Replace one row wholesale. Returns null if there is nothing to replace. */
export function replaceStudent(id: string | number, next: Student): Student | null {
  const database = load()
  const index = database.rows.findIndex(row => sameId(row.id, id))
  if (index === -1) return null
  database.rows[index] = next
  persist()
  return clone(next)
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
    database.rows[index] = { ...database.rows[index], ...patch }
    changed = true
  })
  if (changed) persist()
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetStudents(): void {
  db = seed()
  persist()
}
