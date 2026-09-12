/**
 * Callback requests — a parent asking to be rung back.
 *
 * The parent dashboard drew two buttons the app could not honour: "Send a
 * note" when the register says a child is absent, and "Reply to" under a
 * teacher's note. Both were disabled and labelled coming soon, which is the
 * honest placeholder but still a dead control.
 *
 * ── Why a request and not a message ───────────────────────────────────
 * The design asked the question rather than answering it: real messaging, or a
 * one-way request for a callback, "because the second is a fifth of the work
 * and most of the value". This is the second. A parent says what it is about
 * and asks to be called; somebody at the school sees it and marks it done.
 *
 * There is no thread, no reply and no read state, because none of those is
 * what a parent wanted — they wanted somebody to ring them. Adding them later
 * means a `messages` table pointing at one of these, not a rewrite of it.
 *
 * ── It does not send anything ─────────────────────────────────────────
 * Like `reminders/store.ts` beside it, there is no gateway behind this. It
 * records the intent, which is the half a backend keeps anyway, so that what
 * the screen claims is about something that exists.
 */

import { newId } from '@/mocks/_shared'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'

/** Where the request came from, which is the only "thread" there is. */
export type CallbackReason = 'absence' | 'classroom-note' | 'general'

export interface CallbackRequest {
  id: string
  /** The child it is about — `user_profiles.id`, the axis a family is scoped on. */
  studentId: string
  studentName: string
  /** Whoever asked, for the person reading it. */
  requestedBy: string
  /**
   * The teacher it names, when there is one. A note has an author to reply to;
   * an absence has nobody in particular, so this is null and any member of
   * staff who sees the child's record can pick it up.
   */
  teacherName: string | null
  reason: CallbackReason
  /** What the parent typed. */
  note: string
  /** ISO 8601. */
  requestedAt: string
  /** Set when somebody marks it done. Null while it is open. */
  resolvedAt: string | null
  resolvedBy: string | null
}

const TABLE = 'callback-requests'

interface Database {
  rows: CallbackRequest[]
}

let db: Database | null = null

// These rows belong to one school; the key says which. Dropping the cached
// copy on a switch is what stops the last school's rows being served as this
// one's — see `tenant-context`.
onTenantSwitch(() => {
  db = null
})

/**
 * Empty, deliberately — the same reasoning as the reminder log.
 *
 * A seeded request would be a claim that a named parent rang about a named
 * child on a date. "Nothing yet" is the only honest start for a table whose
 * rows are things people actually did.
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

/** Newest first. Pass a student id to narrow to one child's history. */
export function listCallbacks(studentId?: string): CallbackRequest[] {
  const rows = load().rows
  return (studentId ? rows.filter(row => row.studentId === studentId) : rows).map(row => ({
    ...row,
  }))
}

export function recordCallback(input: {
  studentId: string
  studentName: string
  requestedBy: string
  teacherName: string | null
  reason: CallbackReason
  note: string
}): CallbackRequest {
  const database = load()
  const request: CallbackRequest = {
    ...input,
    id: newId('CB'),
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  }
  database.rows.unshift(request)
  persist()
  return { ...request }
}

/** Mark one done. Returns the updated row, or undefined if the id is unknown. */
export function resolveCallback(id: string, resolvedBy: string): CallbackRequest | undefined {
  const row = load().rows.find(candidate => candidate.id === id)
  if (!row) return undefined
  row.resolvedAt = new Date().toISOString()
  row.resolvedBy = resolvedBy
  persist()
  return { ...row }
}

/** Wipe — the equivalent of re-running the backend's seed script. */
export function resetCallbacks(): void {
  db = seed()
  persist()
}
