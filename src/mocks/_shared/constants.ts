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
