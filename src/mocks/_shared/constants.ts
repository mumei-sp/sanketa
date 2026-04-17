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
 * Scaling multipliers that turn the small demo mocks into realistic campus
 * numbers. `studentsData` ships ~40 rows for tables; `teachersData` ships
 * ~18 for cards. These factors expand them to what a real Sanketa campus
 * would report on headline KPIs.
 *
 * Exporting from _shared/constants.ts rather than dashboard.ts lets every
 * chart (gender donut, attendance bars, trend graphs) pull from the same
 * source and stay consistent with the stat tiles.
 */
export const SCHOOL_SCALE = {
  /** Multiplier applied to studentsData.length to get total enrolment. */
  enrollmentMultiplier: 30,
  /** Multiplier applied to teachersData.length to get total faculty. */
  facultyMultiplier: 5,
  /** Number of grade levels in the school (used to approximate per-grade counts). */
  gradeCount: 12,
  /** Average attendance rate — used to size daily/weekly attendance figures. */
  attendanceRate: 0.93,
} as const
