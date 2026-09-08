/**
 * The mock notification server's database.
 *
 * Stands in for the table a backend would own. It is deliberately *not* app
 * state: read state, ordering and the cursor all live here because that is
 * where they live in a real deployment, which is what makes the eventual swap
 * a change of one function body per endpoint rather than a redesign.
 *
 * `localStorage` is this database's disk. Nothing in `src/features/` may read
 * that key — the only way in or out is through the functions below, exactly as
 * the only way into a real table is through the API.
 *
 * Ordering and the cursor
 * -----------------------
 * Every record gets a monotonically increasing `seq` on insert, and the cursor
 * is simply the highest `seq` a client has been handed. `getSince(cursor)`
 * returns everything above it. Sequence rather than timestamp because two
 * notifications can share a millisecond, and a client that resumed from a
 * timestamp would silently drop one of them.
 */

import { newId } from '@/mocks/_shared'
import {
  migratePermissionIds,
  needsPermissionMigration,
} from '@/config/permissions'
import type {
  DomainEvent,
  Notification,
  NotificationBatch,
  NotificationViewer,
} from '@/features/notifications/types'
import { deriveNotification } from './rules'
import { SEED_NOTIFICATIONS } from './seed'

const DB_KEY = 'sanketa:mock-db:notifications'

/** A row as the server holds it — the public `Notification` plus its sequence. */
interface StoredNotification extends Notification {
  seq: number
  /**
   * Permissions that make this row worth delivering. Empty means everyone.
   *
   * Server-only, and stripped before anything leaves: a client has no use for
   * the reason it was sent something, and shipping the rule would tell every
   * reader what other readers can see.
   */
  audience?: string[]
}

interface Database {
  rows: StoredNotification[]
  /** Highest `seq` handed out so far. */
  lastSeq: number
  /**
   * Keys of notifications the sweep has already raised.
   *
   * Time-derived notifications have a problem event-driven ones do not: the
   * condition that produced them is still true on the next sweep. An overdue
   * fee stays overdue, so sweeping every few minutes would raise it every few
   * minutes forever. The key carries the day, so a condition fires once per
   * day per subject and stops when it is resolved.
   *
   * On a server this would be a unique index rather than a list.
   */
  derivedKeys?: string[]
}

type Listener = (batch: NotificationBatch) => void

/**
 * An open connection, and who is on the other end of it.
 *
 * A real SSE stream is per-user, so the fan-out decision belongs here rather
 * than in the client: pushing every row to every listener and filtering on
 * arrival would mean the wrong person's browser had already received it.
 */
interface Subscription {
  listener: Listener
  viewer?: NotificationViewer
}

const subscriptions = new Set<Subscription>()

let db: Database | null = null

/** Strip server-only columns before anything leaves the database. */
function toPublic(row: StoredNotification): Notification {
  const { seq: _seq, audience: _audience, ...rest } = row
  return rest
}

/**
 * Should this row reach this viewer?
 *
 * Open by default, twice over: a row with no audience reaches everyone, and so
 * does every row when no viewer is supplied. Both defaults point the same way
 * on purpose — a rule that forgets to declare an audience, or a caller that
 * forgets to say who it is, should over-deliver rather than silently deliver
 * to nobody. A notification that reaches no one is indistinguishable from a
 * rule that never fired, which is the failure you cannot debug.
 *
 * Rows written before this column existed have no audience and so stay
 * visible, which is the same rule and needs no migration.
 */
function reaches(row: StoredNotification, viewer?: NotificationViewer): boolean {
  if (!viewer) return true
  const audience = row.audience ?? []
  if (audience.length === 0) return true
  return audience.some(permission => viewer.permissions.includes(permission))
}

function seedDatabase(): Database {
  let seq = 0
  const rows = SEED_NOTIFICATIONS.map(draft => ({ ...draft, seq: ++seq }))
  return { rows, lastSeq: seq }
}

function load(): Database {
  if (db) return db

  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      // A stored database missing its bookkeeping is corrupt, not merely old;
      // reseeding beats serving a feed whose cursor can never advance.
      if (Array.isArray(parsed.rows) && typeof parsed.lastSeq === 'number') {
        // Audiences are permission ids, so a release that renames one has to
        // reach this table as well as the roles table. It did not the first
        // time, and every row written beforehand addressed an audience nobody
        // held any more — a feed that silently emptied rather than erroring.
        const renamed = parsed.rows.some(row =>
          needsPermissionMigration(row.audience ?? []),
        )
        db = renamed
          ? {
              ...parsed,
              rows: parsed.rows.map(row =>
                row.audience
                  ? { ...row, audience: migratePermissionIds(row.audience) }
                  : row,
              ),
            }
          : parsed
        if (renamed) persist()
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }

  db = seedDatabase()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode. The in-memory copy still serves this session,
    // which is the same degradation a backend outage would produce.
  }
}

/** Newest first — the order every consumer wants, decided once, here. */
function byNewest(a: StoredNotification, b: StoredNotification): number {
  return b.seq - a.seq
}

// ── Reads ─────────────────────────────────────────────────────────────

/**
 * Everything newer than `cursor`, oldest-first within the batch so a client
 * applying it in order ends up with the same sequence the server has.
 *
 * Called with no cursor this returns the full history, which is what a client
 * does on its first connect.
 */
export function getSince(
  cursor?: string,
  limit = 50,
  viewer?: NotificationViewer,
): NotificationBatch {
  const database = load()
  const since = cursor ? Number(cursor) : 0
  const fresh = database.rows
    .filter(row => row.seq > since && reaches(row, viewer))
    .sort((a, b) => a.seq - b.seq)
    .slice(0, limit)

  return {
    items: fresh.map(toPublic),
    // Hold the cursor where it was when there is nothing new, so an idle poll
    // never advances past records it has not actually delivered.
    cursor: String(fresh.length > 0 ? fresh[fresh.length - 1].seq : database.lastSeq),
  }
}

/** The whole feed, newest first. The first page a panel renders. */
export function getAll(limit = 50, viewer?: NotificationViewer): NotificationBatch {
  const database = load()
  const rows = database.rows
    .filter(row => reaches(row, viewer))
    .sort(byNewest)
    .slice(0, limit)
  return { items: rows.map(toPublic), cursor: String(database.lastSeq) }
}

export function getUnreadCount(viewer?: NotificationViewer): number {
  return load().rows.filter(row => row.readAt === null && reaches(row, viewer)).length
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * Take a domain event, decide whether it deserves a notification, store it and
 * tell every connected client.
 *
 * This is the server's job in miniature: services report *what happened*, and
 * the decision of whether anyone should hear about it is made here.
 */
export function publish(event: DomainEvent): Notification | null {
  const draft = deriveNotification(event)
  if (!draft) return null

  const database = load()
  const row: StoredNotification = {
    id: newId('ntf'),
    seq: ++database.lastSeq,
    category: draft.category,
    severity: draft.severity,
    title: draft.title,
    body: draft.body,
    actor: event.actor ?? null,
    target: draft.target ?? null,
    createdAt: event.occurredAt ?? new Date().toISOString(),
    readAt: null,
    audience: draft.audience,
  }

  database.rows.push(row)
  persist()

  const published = toPublic(row)
  subscriptions.forEach(subscription => {
    // Silence, not an empty batch: a client that received `items: []` would
    // advance its cursor past a row it was never allowed to see, and then
    // never fetch it if its permissions later changed.
    if (!reaches(row, subscription.viewer)) return
    subscription.listener({ items: [published], cursor: String(row.seq) })
  })

  return published
}

export function markRead(id: string): Notification | null {
  const database = load()
  const row = database.rows.find(candidate => candidate.id === id)
  if (!row) return null
  if (row.readAt === null) {
    row.readAt = new Date().toISOString()
    persist()
  }
  return toPublic(row)
}

/** Returns how many were actually flipped, which is what the caller reports. */
/**
 * Scoped to what the viewer can see.
 *
 * "Mark all read" means the list in front of you, not the table behind it —
 * without the filter a teacher clearing their feed would silently mark the
 * finance office's unread rows as read too.
 */
export function markAllRead(viewer?: NotificationViewer): number {
  const database = load()
  const now = new Date().toISOString()
  let changed = 0
  database.rows.forEach(row => {
    if (row.readAt === null && reaches(row, viewer)) {
      row.readAt = now
      changed += 1
    }
  })
  if (changed > 0) persist()
  return changed
}

export function dismiss(id: string): boolean {
  const database = load()
  const index = database.rows.findIndex(row => row.id === id)
  if (index === -1) return false
  database.rows.splice(index, 1)
  persist()
  return true
}

// ── Live delivery ─────────────────────────────────────────────────────

/**
 * Stand-in for an open SSE connection.
 *
 * Returns an unsubscribe function, mirroring `EventSource.close()`. Delivery
 * is best-effort by design: a client that misses a batch here (because it was
 * disconnected) recovers by calling `getSince` with its last cursor, which is
 * exactly the reconciliation a real client performs on reconnect.
 */
export function subscribe(listener: Listener, viewer?: NotificationViewer): () => void {
  const subscription: Subscription = { listener, viewer }
  subscriptions.add(subscription)
  return () => {
    subscriptions.delete(subscription)
  }
}

/**
 * Publish a time-derived notification, at most once per key.
 *
 * Returns null when the key has been seen, which is the common case and not an
 * error — most sweeps find nothing new.
 */
export function publishDerived(key: string, event: DomainEvent): Notification | null {
  const database = load()
  const seen = database.derivedKeys ?? []
  if (seen.includes(key)) return null

  const published = publish(event)
  // Remembered even when the rule declined to notify, so a rule that returns
  // null is not re-evaluated on every sweep for the rest of the day.
  database.derivedKeys = [...seen, key].slice(-500)
  persist()
  return published
}

/**
 * Wipe and reseed. Exposed for development — resetting the mock database is
 * the equivalent of re-running the backend's seed script.
 */
export function resetDatabase(): void {
  db = seedDatabase()
  persist()
}
