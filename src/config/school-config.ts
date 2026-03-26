/**
 * School Configuration — Types, Defaults, and Constants
 *
 * Central definition for all school-level settings.
 * Extensible: add new fields here as the settings panel grows.
 *
 * This is the SINGLE SOURCE OF TRUTH for configuration shape and defaults.
 */

// ============================================================================
// Types
// ============================================================================

/** Term/semester structure options */
export type TermStructure = 'semester' | 'trimester' | 'quarter'

/**
 * School configuration shape.
 * All fields have sensible defaults — see DEFAULT_SCHOOL_CONFIG.
 *
 * When adding new settings sections (grading, notifications, etc.),
 * extend this interface and add defaults below.
 */
export interface SchoolConfig {
  // ── General ──
  /** Display name of the school */
  schoolName: string

  // ── Academic Calendar ──
  /** Month the academic year starts (0=January, 3=April, 7=August) */
  academicYearStartMonth: number
  /** How the academic year is divided into terms */
  termStructure: TermStructure
}

// ============================================================================
// Defaults
// ============================================================================

/** Default config — used on first load and for "Reset to Defaults" */
export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'Sanketa School',
  academicYearStartMonth: 3, // April (common for Indian academic year)
  termStructure: 'semester',
} as const

// ============================================================================
// Constants
// ============================================================================

/** Full month names indexed 0-11 */
export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** Short month names indexed 0-11 */
export const MONTH_SHORT_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Term structure options for the settings UI */
export const TERM_STRUCTURE_OPTIONS: {
  value: TermStructure
  label: string
  description: string
  termCount: number
}[] = [
  { value: 'semester', label: 'Semester', description: '2 terms of 6 months', termCount: 2 },
  { value: 'trimester', label: 'Trimester', description: '3 terms of 4 months', termCount: 3 },
  { value: 'quarter', label: 'Quarter', description: '4 terms of 3 months', termCount: 4 },
]

/** localStorage key for persisting school config */
export const SCHOOL_CONFIG_STORAGE_KEY = 'sanketa:school-config'
