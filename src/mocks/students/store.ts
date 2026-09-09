/**
 * Persistence for the student directory.
 *
 * Every other mock table — users, roles, parents, transport, notifications —
 * keeps its rows in `localStorage` and survives a reload. Students did not:
 * `studentsData` was a plain array, so a student enrolled through the form
 * lasted until the next refresh. That was survivable while nothing else
 * pointed at a student, and stopped being survivable once the student form
 * started writing `student_parents` rows, which *are* durable: enrolling a
 * child left a permanent link to an id that no longer existed.
 *
 * ── Why this is not shaped like the other stores ───────────────────────
 * The sibling stores expose functions and keep their array private, and the
 * rule is that only a service may import them. `studentsData` cannot follow
 * yet: nine modules import the array itself, three of them reading `.length`
 * at module-evaluation time, and one of those lives in `src/features/`. So
 * this file persists the array without changing how anyone reads it — the
 * array identity handed out on first load is the one every importer keeps,
 * and hydration replaces its *contents* rather than the binding.
 *
 * Moving those callers onto accessors is the next step and a separate one.
 * Until then this is honestly a persistence layer, not an encapsulated table.
 */

import type { Student } from '@/features/students/types'

const DB_KEY = 'sanketa:mock-db:students'

interface Database {
  rows: Student[]
  /** Which fixture list these rows were seeded from. See `signatureOf`. */
  seed: string
}

/**
 * A cheap fingerprint of the seed rows.
 *
 * Stored alongside the rows so that editing `students.ts` reseeds instead of
 * being silently ignored. Every other mock table has the opposite behaviour
 * and it is tolerable there, because nobody edits the roles fixture twice a
 * week — but the student directory is *the* fixture people reach for, and a
 * store that quietly serves last week's copy of it costs an hour before
 * anyone thinks to look in localStorage.
 *
 * A hash, not a hand-bumped version number, because the version number is the
 * thing you forget to bump on exactly the change you needed it for.
 */
function signatureOf(fixtures: Student[]): string {
  const text = JSON.stringify(fixtures)
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  }
  return `${fixtures.length}:${hash}`
}

/** The one array every importer holds. Set by `hydrateStudents`. */
let live: Student[] | null = null

/** The fixture fingerprint this session hydrated against. */
let seed = ''

/**
 * The array `studentsData` becomes: the persisted rows if there are any,
 * otherwise a copy of the fixtures.
 *
 * A copy, not the fixture literal, so `resetStudents` has something
 * unmodified to put back — mutating the seed would make "reset" restore
 * whatever the last session did to it.
 */
export function hydrateStudents(fixtures: Student[]): Student[] {
  if (live) return live
  seed = signatureOf(fixtures)
  const stored = readPersisted(seed)
  live = stored ?? fixtures.map(student => ({ ...student }))
  if (!stored) persistStudents()
  return live
}

function readPersisted(expectedSeed: string): Student[] | null {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Database
    // An empty array is not a school. A stored file that says so is a
    // half-written one, and reseeding beats showing a directory of nobody.
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null
    // The fixtures have been edited since this was written. The edit is the
    // newer intent, so it wins — including over anything this browser added,
    // which is the same bargain as re-running a seed script.
    if (parsed.seed !== expectedSeed) return null
    return parsed.rows
  } catch {
    // Unparseable, or unavailable in private mode. Fall back to the fixtures.
    return null
  }
}

/**
 * Write the current rows to disk.
 *
 * Called by `student-service` after each mutation rather than wrapped around
 * the array, because the mutations are ordinary array and field writes spread
 * across create, update and promotion — a Proxy that caught them all would
 * hide where the writes happen for the sake of three call sites.
 */
export function persistStudents(): void {
  if (!live) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ rows: live, seed } satisfies Database))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

/**
 * Put the fixtures back — the equivalent of re-running the backend's seed.
 *
 * In place, because the array identity is the whole contract here: importers
 * hold the array, not a getter, so replacing the binding would leave them all
 * pointing at the old contents.
 */
export function resetStudents(fixtures: Student[]): void {
  if (!live) return
  seed = signatureOf(fixtures)
  live.splice(0, live.length, ...fixtures.map(student => ({ ...student })))
  persistStudents()
}
