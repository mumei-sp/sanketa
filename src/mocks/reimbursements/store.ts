/**
 * The mock reimbursement table.
 *
 * Approve and Decline used to be two buttons calling `preventDefault` — they
 * rendered, they were clickable, and nothing anywhere changed. That is worse
 * than a missing feature: a finance officer would click Approve, see the row
 * sit there, and have no way to know whether the money was released.
 *
 * Same shape as every other mock table: rows with ids, reads and writes
 * through functions, `localStorage` as the disk, and only a service allowed to
 * import it.
 *
 * A decision is recorded, not just applied. Who decided and when are the two
 * facts anybody asks about afterwards, and a status with neither of them is
 * only half an answer.
 */

import { reimbursementsData } from '@/mocks/expenses'
import type { Reimbursement, ReimbursementStatus } from '@/features/expenses/types'

const DB_KEY = 'sanketa:mock-db:reimbursements'

interface Database {
  rows: Reimbursement[]
}

let db: Database | null = null

function seed(): Database {
  return { rows: reimbursementsData.map(row => ({ ...row })) }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
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

export function listReimbursements(): Reimbursement[] {
  return load().rows.map(row => ({ ...row }))
}

export function getReimbursement(requestId: string): Reimbursement | null {
  const found = load().rows.find(row => row.requestId === requestId)
  return found ? { ...found } : null
}

/**
 * Approve or decline a request.
 *
 * Refuses anything already decided rather than overwriting it. Two people
 * looking at the same list is the normal case, and the second click should
 * lose rather than silently replace the first person's decision — the same
 * reason the role editor writes through a service instead of a draft.
 */
export function decideReimbursement(
  requestId: string,
  decision: Exclude<ReimbursementStatus, 'Pending'>,
  decidedBy: string,
): { ok: true; row: Reimbursement } | { ok: false; reason: string } {
  const database = load()
  const row = database.rows.find(candidate => candidate.requestId === requestId)
  if (!row) return { ok: false, reason: 'That request no longer exists.' }
  if (row.status !== 'Pending') {
    return {
      ok: false,
      reason: `${row.requestId} was already ${row.status.toLowerCase()}${
        row.decidedBy ? ` by ${row.decidedBy}` : ''
      }.`,
    }
  }

  row.status = decision
  row.decidedBy = decidedBy
  row.decidedAt = new Date().toISOString()
  persist()
  return { ok: true, row: { ...row } }
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetReimbursements(): void {
  db = seed()
  persist()
}
