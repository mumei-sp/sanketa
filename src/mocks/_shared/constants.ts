/**
 * Project-wide mock constants. Centralised so a single edit updates every
 * feature's fake data consistently.
 */

/** Canonical school domain. Every mock user email resolves against this. */
export const SCHOOL_DOMAIN = 'sanketa.edu'

/** Canonical school display name. */
export const SCHOOL_NAME = 'Sanketa Public School'

/** Display country code for Indian phone numbers. */
export const PHONE_COUNTRY_CODE = '+91'

/** ISO country the school operates in (used for addresses). */
export const COUNTRY_CODE = 'IN'

/** Canonical currency symbol + ISO code used across fees / expenses / etc. */
export const CURRENCY = { symbol: '₹', code: 'INR' } as const

/** Deterministic seed offset for mock IDs. Change to re-number the universe. */
export const ID_BASE = {
  student: 2101,
  teacher: 1001,
  driver: 1,
  vehicle: 1,
  route: 1,
  expense: 5001,
} as const

/**
 * School-wide rates the dashboards size their charts with.
 *
 * ── What used to be here ───────────────────────────────────────────────
 * Two multipliers: `enrollmentMultiplier: 30` and `facultyMultiplier: 5`. The
 * roster shipped forty students, so every headline was a small number scaled
 * up — "1,200 Enrolled Students" over a directory you could page through in
 * two screens, and ninety teachers over a list of eighteen. Any number the
 * dashboard showed disagreed with the screen it linked to, and the trend
 * charts were built on the invented total rather than the real one.
 *
 * The roster is generated at the size of a school now (see
 * `mocks/tenants/_generate/roster.ts`), so the counts come from the tables and
 * the multipliers are gone. What is left is a rate, which is a fact about a
 * school rather than a way of hiding a small fixture.
 */
export const SCHOOL_SCALE = {
  /** Average daily attendance — used to size daily/weekly attendance figures. */
  attendanceRate: 0.93,
} as const
