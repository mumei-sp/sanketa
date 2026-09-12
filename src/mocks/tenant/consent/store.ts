/**
 * Consent responses — one family's answer about one child for one event.
 *
 * ── Why there is no `consent_slips` table ─────────────────────────────
 * The ASK is a calendar event carrying `needsConsent` — see
 * `CalendarEventExtendedProps`. An event already has a title, a date and a
 * `reach`, and `audienceReaches` already decides which families it speaks to.
 * A separate slips table would have had to repeat all four, and a second
 * audience implementation is a second thing to get wrong.
 *
 * What is genuinely new is the part that is per CHILD rather than per event,
 * and that is this: who answered, what they said, and when.
 *
 * ── Who answered, not whether the right person did ────────────────────
 * `student_parents.isPrimary` exists and means "the one the school rings
 * first". It is tempting to reuse it as "the one who may consent", and that is
 * the trap the design warned about — one flag doing five jobs. It is not
 * needed: `studentsOfGuardian` already gives every linked guardian equal
 * access to a child, so any of them may answer, and the honest thing is to
 * record WHICH one did. If a school ever needs consent restricted to one named
 * guardian, that is a new column on the link, not a new meaning for this one.
 */

import { newId } from '@/mocks/_shared'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'

export type ConsentAnswer = 'given' | 'declined'

export interface ConsentResponse {
  id: string
  /** The event that asked. */
  eventId: string
  /** The child it is about — `user_profiles.id`. */
  studentId: string
  answer: ConsentAnswer
  /** The guardian who answered — profile id, and their name for reading back. */
  answeredById: string
  answeredByName: string
  /** ISO 8601. */
  answeredAt: string
}

const TABLE = 'consent-responses'

interface Database {
  rows: ConsentResponse[]
}

let db: Database | null = null

// These rows belong to one school; the key says which. Dropping the cached
// copy on a switch is what stops the last school's rows being served as this
// one's — see `tenant-context`.
onTenantSwitch(() => {
  db = null
})

/**
 * Empty, deliberately.
 *
 * A seeded response would be a claim that a named parent consented to a named
 * child going somewhere. That is exactly the kind of record that must only
 * exist because somebody made it — the same reasoning as the reminder log and
 * the callback requests beside it.
 */
function seed(): Database {
  return { rows: [] }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows)) {
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

/** Every answer, optionally narrowed to one event or one child. */
export function listResponses(filter?: {
  eventId?: string
  studentId?: string
}): ConsentResponse[] {
  return load()
    .rows.filter(
      row =>
        (filter?.eventId === undefined || row.eventId === filter.eventId) &&
        (filter?.studentId === undefined || row.studentId === filter.studentId),
    )
    .map(row => ({ ...row }))
}

/**
 * Answer, or change an answer.
 *
 * One row per (event, child): a family that says no and rings back to say yes
 * has changed their mind, not answered twice, and a second row would leave the
 * trip list ambiguous about which one counts.
 */
export function recordResponse(input: {
  eventId: string
  studentId: string
  answer: ConsentAnswer
  answeredById: string
  answeredByName: string
}): ConsentResponse {
  const database = load()
  const existing = database.rows.find(
    row => row.eventId === input.eventId && row.studentId === input.studentId,
  )
  const answeredAt = new Date().toISOString()

  if (existing) {
    existing.answer = input.answer
    existing.answeredById = input.answeredById
    existing.answeredByName = input.answeredByName
    existing.answeredAt = answeredAt
    persist()
    return { ...existing }
  }

  const row: ConsentResponse = { ...input, id: newId('CN'), answeredAt }
  database.rows.unshift(row)
  persist()
  return { ...row }
}

/** Wipe — the equivalent of re-running the backend's seed script. */
export function resetResponses(): void {
  db = seed()
  persist()
}
