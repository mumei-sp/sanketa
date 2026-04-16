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

/** True if the given date is a Saturday (6) or Sunday (0). */
function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
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

/** Full ISO timestamp with seconds, UTC. */
export function isoDateTime(d: Date | string | number = new Date()): string {
  const date = typeof d === 'object' ? d : new Date(d)
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
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

/**
 * Walk backwards from today skipping weekends, returning the nth business day.
 * `businessDaysAgo(0)` → today (or the previous business day if today is a weekend).
 */
export function businessDaysAgo(n: number, base: Date = new Date()): Date {
  let cursor = atMidnight(base)
  let stepsRemaining = n
  // First, if we're starting on a weekend, snap back to Friday.
  while (isWeekend(cursor)) cursor = new Date(cursor.getTime() - MS_PER_DAY)
  while (stepsRemaining > 0) {
    cursor = new Date(cursor.getTime() - MS_PER_DAY)
    if (!isWeekend(cursor)) stepsRemaining--
  }
  return cursor
}

/**
 * Walk forward from today skipping weekends.
 */
export function businessDaysFromNow(n: number, base: Date = new Date()): Date {
  let cursor = atMidnight(base)
  let stepsRemaining = n
  while (isWeekend(cursor)) cursor = new Date(cursor.getTime() + MS_PER_DAY)
  while (stepsRemaining > 0) {
    cursor = new Date(cursor.getTime() + MS_PER_DAY)
    if (!isWeekend(cursor)) stepsRemaining--
  }
  return cursor
}

/**
 * Produce `count` dates scattered deterministically across the last `days` days.
 * The spread is even-ish (quantised) so records don't cluster on one day.
 *
 * Example: `scatterPastDates(10, 30)` → 10 dates evenly spread over the last month.
 */
export function scatterPastDates(count: number, days: number, base: Date = new Date()): Date[] {
  if (count <= 0) return []
  const step = days / count
  const out: Date[] = []
  for (let i = 0; i < count; i++) {
    const offset = -Math.round((i + 0.5) * step)
    out.push(relativeDate(offset, base))
  }
  return out
}

/**
 * Same as scatterPastDates but centred around today, half in the past and half in the future.
 */
export function scatterAroundToday(count: number, spanDays: number, base: Date = new Date()): Date[] {
  if (count <= 0) return []
  const step = spanDays / count
  const out: Date[] = []
  for (let i = 0; i < count; i++) {
    const offset = Math.round((i + 0.5) * step - spanDays / 2)
    out.push(relativeDate(offset, base))
  }
  return out
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
