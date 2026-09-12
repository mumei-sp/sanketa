/**
 * Deterministic ID helpers for mock data.
 *
 * We deliberately avoid `Date.now()` / `Math.random()` for seed IDs so two
 * renders of the mock dataset produce byte-identical output. Runtime helpers
 * (like `newId(...)`) DO use timestamps because they're called in response to
 * user-driven CRUD and don't need to be replayable.
 */

import { yyyymm } from './date-helpers'

/**
 * Format an incrementing ID like `S-2101`, `T-1001`, `EX-5001` from a prefix
 * and a numeric seed. Mocks use this to generate a stable series.
 */
export function makeId(prefix: string, seed: number, pad = 4): string {
  return `${prefix}-${String(seed).padStart(pad, '0')}`
}

/**
 * Transaction ID: `TXN-202604-0042` — month segment updates automatically so
 * mock fee payments always look recent.
 */
export function txnId(sequence: number): string {
  return `TXN-${yyyymm()}-${String(sequence).padStart(4, '0')}`
}

/**
 * Short, URL-safe pseudo-UUID used for fresh records created by user action.
 * Not cryptographically random — good enough for mock CRUD.
 */
function shortUuid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  )
}

/**
 * New ID for a freshly created entity: `${prefix}-${shortUuid()}`.
 * Services use this in `create*` mock adapters so the new row has a distinct,
 * collision-free ID without disturbing the seeded numeric series.
 */
export function newId(prefix: string): string {
  return `${prefix}-${shortUuid()}`
}
