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
import type {
  DomainEvent,
  Notification,
  NotificationBatch,
} from '@/features/notifications/types'
import { deriveNotification } from './rules'
import { SEED_NOTIFICATIONS } from './seed'

const DB_KEY = 'sanketa:mock-db:notifications'

/** A row as the server holds it — the public `Notification` plus its sequence. */
interface StoredNotification extends Notification {
  seq: number
}

interface Database {
  rows: StoredNotification[]
  /** Highest `seq` handed out so far. */
  lastSeq: number
}

type Listener = (batch: NotificationBatch) => void

const listeners = new Set<Listener>()

let db: Database | null = null

/** Strip server-only columns before anything leaves the database. */
function toPublic(row: StoredNotification): Notification {
  const { seq: _seq, ...rest } = row
  return rest
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
        db = parsed
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
export function getSince(cursor?: string, limit = 50): NotificationBatch {
  const database = load()
  const since = cursor ? Number(cursor) : 0
  const fresh = database.rows
    .filter(row => row.seq > since)
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
export function getAll(limit = 50): NotificationBatch {
  const database = load()
  const rows = [...database.rows].sort(byNewest).slice(0, limit)
  return { items: rows.map(toPublic), cursor: String(database.lastSeq) }
}

export function getUnreadCount(): number {
  return load().rows.filter(row => row.readAt === null).length
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
  }

  database.rows.push(row)
  persist()

  const published = toPublic(row)
  const batch: NotificationBatch = { items: [published], cursor: String(row.seq) }
  listeners.forEach(listener => listener(batch))

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
export function markAllRead(): number {
  const database = load()
  const now = new Date().toISOString()
  let changed = 0
  database.rows.forEach(row => {
    if (row.readAt === null) {
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
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Wipe and reseed. Exposed for development — resetting the mock database is
 * the equivalent of re-running the backend's seed script.
 */
export function resetDatabase(): void {
  db = seedDatabase()
  persist()
}
