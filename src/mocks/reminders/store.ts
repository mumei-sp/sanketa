/**
 * The mock payment-reminder log.
 *
 * "Send Payment Reminder" used to be a button that showed a toast reading
 * *"sent via SMS & Email"* and did nothing else. Nothing was sent, nothing was
 * recorded, and the next person to open the panel had no way to tell whether
 * the guardian had been contacted once, five times, or never. A control that
 * claims an action it did not take is the worst kind of dead control: the
 * inert ones only waste a click.
 *
 * This does not send anything either — there is no gateway behind it — but it
 * records the intent, which is the half a backend would keep anyway. The panel
 * reads it back, so the claim on screen is now about something that exists.
 */

import { newId } from '@/mocks/_shared'

export interface PaymentReminder {
  id: string
  studentId: string
  studentName: string
  /** Amount outstanding at the moment the reminder went out. */
  amount: number
  /** ISO 8601. */
  sentAt: string
  sentBy: string
}

const DB_KEY = 'sanketa:mock-db:payment-reminders'

interface Database {
  rows: PaymentReminder[]
}

let db: Database | null = null

/**
 * Empty, deliberately.
 *
 * Every other table is seeded so the app has something to show, but a seeded
 * reminder history would be a claim that specific guardians were contacted on
 * specific dates. The one table where "nothing yet" is the honest start.
 */
function seed(): Database {
  return { rows: [] }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
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
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

/** Newest first. Pass a student id to narrow to one guardian's history. */
export function listReminders(studentId?: string): PaymentReminder[] {
  const rows = load().rows
  return (studentId ? rows.filter(row => row.studentId === studentId) : rows).map(row => ({
    ...row,
  }))
}

export function recordReminder(input: {
  studentId: string
  studentName: string
  amount: number
  sentBy: string
}): PaymentReminder {
  const database = load()
  const reminder: PaymentReminder = {
    ...input,
    id: newId('PR'),
    sentAt: new Date().toISOString(),
  }
  database.rows.unshift(reminder)
  persist()
  return { ...reminder }
}

/** Wipe — the equivalent of re-running the backend's seed script. */
export function resetReminders(): void {
  db = seed()
  persist()
}
