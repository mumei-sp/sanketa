/**
 * The mock audit log.
 *
 * The one thing an access-control screen cannot be professional without. A
 * role editor that silently accepts changes leaves nobody able to answer the
 * question every school eventually asks: *who gave them that, and when?* Every
 * write on the Access screen appends a line here.
 *
 * Append-only on purpose. There is no update and no delete, because a log that
 * can be edited answers nothing — if the record can be rewritten by whoever
 * made the change, it stops being evidence. A backend would enforce that with
 * table grants; here it is enforced by there being no function for it.
 *
 * Who did it comes from the caller rather than the store. That is a mock's
 * compromise and worth naming: a real backend reads the actor off the request's
 * token, where a client cannot claim to be someone else. When these calls
 * become HTTP the `actor` argument disappears and the server fills it in.
 */

import { newId } from '@/mocks/_shared'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'

/** What kind of change happened. Kept coarse — the summary carries detail. */
export type AccessEventKind =
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'user.role'
  | 'user.classes'
  | 'user.create'

/** Which table a change landed on. */
/**
 * What a reversible change was made to.
 *
 * `role` and `user` are the global rows — a role's permissions, an account's
 * identity. `profile`, `profile-role` and `profile-classes` are per-school:
 * whether somebody is anybody at *this* school, and what they hold there.
 * Separate entities because undoing them means writing to different tables,
 * and because an entry made at one school must not be reversible from another.
 *
 * `profile` is the biggest of them to reverse: removing a profile takes every
 * role granted since with it, because those rows are *about* the profile.
 */
export type AccessEntity =
  | 'role'
  | 'user'
  | 'profile'
  | 'profile-role'
  | 'profile-classes'

/**
 * The change in a form something other than a person can read.
 *
 * Before and after rather than a description of the operation, because that is
 * what makes an entry reversible: undoing is writing `before` back, whatever
 * the operation was. `null` on either side means the row did not exist then —
 * `before: null` is a creation, `after: null` is a deletion.
 *
 * Only the fields that changed are carried. A permission edit stores two
 * permission arrays, not two whole roles, so the log does not quietly become a
 * second copy of the tables it describes.
 */
export interface AccessChange {
  entity: AccessEntity
  id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export interface AccessEvent {
  id: string
  /** ISO timestamp. */
  at: string
  actorName: string
  kind: AccessEventKind
  /** The role or person the change landed on. */
  target: string
  /** One sentence, already written for a reader. */
  summary: string
  /** The change itself, when there is something to spell out. */
  detail?: string
  /** What actually moved, for undo. Absent on entries that predate it. */
  change?: AccessChange
  /**
   * The entry this one reverses.
   *
   * An undo is a new line, never a flag set on the old one — the log stays
   * append-only, and "this was undone" is derived by looking for an entry
   * pointing at it. A record the people it records can amend is not a record.
   */
  undoOf?: string
}

const TABLE = 'access-log'

/**
 * How much history to keep.
 *
 * A real audit table keeps everything and archives on a schedule. This one
 * lives in `localStorage`, which has a few megabytes for the whole app, so it
 * keeps the most recent slice. Named rather than inlined so the day it moves
 * to a backend it is obvious what to drop.
 */
const MAX_ROWS = 250

interface Database {
  rows: AccessEvent[]
}

let db: Database | null = null

// These rows belong to one school; the key says which. Dropping the cached
// copy on a switch is what stops the last school's rows being served as this
// one's — see `tenant-context`.
onTenantSwitch(() => {
  db = null
})

/**
 * A little history on first run.
 *
 * An audit log is the one screen whose empty state teaches nothing — "no
 * changes yet" looks identical whether the feature works or not. Seeded like
 * every other table in `src/mocks`, and cleared by `resetEvents`.
 */
function seed(): Database {
  const day = 24 * 60 * 60 * 1000
  const now = Date.now()
  return {
    rows: [
      {
        id: 'seed-3',
        at: new Date(now - 2 * day).toISOString(),
        actorName: 'Surya Admin',
        kind: 'user.classes',
        target: 'Meera Iyengar',
        summary: 'Assigned Meera Iyengar to 8A and 8B',
        detail: '+ 8A, + 8B',
      },
      {
        id: 'seed-2',
        at: new Date(now - 9 * day).toISOString(),
        actorName: 'Surya Admin',
        kind: 'user.role',
        target: 'Vikram Shah',
        summary: 'Made Vikram Shah an Accountant',
      },
      {
        id: 'seed-1',
        at: new Date(now - 30 * day).toISOString(),
        actorName: 'Surya Admin',
        kind: 'role.update',
        target: 'Principal',
        summary: 'Changed what Principal can do',
        detail: '− Manage school settings',
      },
    ],
  }
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

/** Newest first — the order every audit view wants and none has to sort. */
export function listEvents(limit = MAX_ROWS): AccessEvent[] {
  return load().rows.slice(0, limit).map(event => ({ ...event }))
}

export function recordEvent(input: Omit<AccessEvent, 'id' | 'at'>): AccessEvent {
  const database = load()
  const event: AccessEvent = { ...input, id: newId('AE'), at: new Date().toISOString() }
  database.rows.unshift(event)
  if (database.rows.length > MAX_ROWS) database.rows.length = MAX_ROWS
  persist()
  return { ...event }
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetEvents(): void {
  db = seed()
  persist()
}
