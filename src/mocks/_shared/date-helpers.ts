/**
 * Date helpers for mock data.
 *
 * All helpers compute values relative to `Date.now()` so mocks never go stale
 * and never need a re-seeding commit when the calendar rolls over. Every
 * function returns strings in two complementary formats that the rest of the
 * app already consumes:
 *
 *   isoDate(...)     →  "2026-04-16"           (used by form inputs, APIs)
 *   displayDate(...) →  "Apr 16, 2026"         (used by cards, tables)
 *   isoDateTime(...) →  "2026-04-16T09:30:00Z" (used by events, timestamps)
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Zero-out the time portion of a date (stays in local tz). */
function atMidnight(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** ISO yyyy-mm-dd (local time, not UTC). */
export function isoDate(d: Date | string | number = new Date()): string {
  const date = typeof d === 'object' ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "Apr 16, 2026" — matches the existing notice-board / expenses display format. */
export function displayDate(d: Date | string | number = new Date()): string {
  const date = typeof d === 'object' ? d : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Relative computation
// ---------------------------------------------------------------------------

/**
 * Shift today by `offset` days (negative = past, positive = future) and return
 * a midnight Date. Useful for seeding records with plausible timestamps.
 */
export function relativeDate(offset: number, base: Date = new Date()): Date {
  const shifted = new Date(base.getTime() + offset * MS_PER_DAY)
  return atMidnight(shifted)
}

/** Same as relativeDate but returns the ISO string. */
export function relativeIso(offset: number, base?: Date): string {
  return isoDate(relativeDate(offset, base))
}

/** Same as relativeDate but returns the display string. */
export function relativeDisplay(offset: number, base?: Date): string {
  return displayDate(relativeDate(offset, base))
}

// ---------------------------------------------------------------------------
// Academic calendar
// ---------------------------------------------------------------------------

/**
 * Returns the Indian academic year string for today, e.g. "2025-26".
 * Indian academic years run April → March, so dates in Apr–Dec inherit the
 * current calendar year; Jan–Mar inherit the previous one.
 */
export function currentAcademicYear(base: Date = new Date()): string {
  const y = base.getFullYear()
  const month = base.getMonth() // 0-indexed
  const start = month >= 3 /* April */ ? y : y - 1
  const end = (start + 1) % 100
  return `${start}-${String(end).padStart(2, '0')}`
}

/**
 * First day of the current academic year (April 1 of `start`).
 */
export function academicYearStart(base: Date = new Date()): Date {
  const [startYear] = currentAcademicYear(base).split('-').map(Number)
  return new Date(startYear, 3, 1, 0, 0, 0, 0) // month 3 = April
}

/**
 * Returns "YYYYMM" string for today — handy for dynamic transaction IDs like
 * `TXN-${yyyymm()}-####` where the month segment stays current automatically.
 */
export function yyyymm(base: Date = new Date()): string {
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}
