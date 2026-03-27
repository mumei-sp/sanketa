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
  /** School logo as base64 data URL (null = use default) */
  schoolLogo: string | null

  // ── Academic Calendar ──
  /** Month the academic year starts (0=January, 3=April, 7=August) */
  academicYearStartMonth: number
  /** How the academic year is divided into terms */
  termStructure: TermStructure

  // ── Timetable ──
  /** Period/break definitions for the school day */
  periods: PeriodDefinition[]
  /** Which days of week have school (0=Mon, 1=Tue, ..., 5=Sat) */
  schoolDays: number[]
}

/** A single period/break slot in the school day (re-exported from timetable types for convenience) */
export interface PeriodDefinition {
  id: string
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

// ============================================================================
// Defaults
// ============================================================================

/** Default config — used on first load and for "Reset to Defaults" */
/** Default period definitions — 6 teaching periods + 2 breaks */
export const DEFAULT_PERIODS: PeriodDefinition[] = [
  { id: 'p1',      label: 'Period 1',    startTime: '08:00', endTime: '08:45', isBreak: false },
  { id: 'p2',      label: 'Period 2',    startTime: '08:45', endTime: '09:30', isBreak: false },
  { id: 'break-1', label: 'Short Break', startTime: '09:30', endTime: '09:45', isBreak: true },
  { id: 'p3',      label: 'Period 3',    startTime: '09:45', endTime: '10:30', isBreak: false },
  { id: 'p4',      label: 'Period 4',    startTime: '10:30', endTime: '11:15', isBreak: false },
  { id: 'lunch',   label: 'Lunch Break', startTime: '11:15', endTime: '11:55', isBreak: true },
  { id: 'p5',      label: 'Period 5',    startTime: '11:55', endTime: '12:40', isBreak: false },
  { id: 'p6',      label: 'Period 6',    startTime: '12:40', endTime: '13:25', isBreak: false },
]

/** Default school days: Monday through Friday */
export const DEFAULT_SCHOOL_DAYS = [0, 1, 2, 3, 4] as const

/** Default config — used on first load and for "Reset to Defaults" */
export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'Sanketa School',
  schoolLogo: null,
  academicYearStartMonth: 3,
  termStructure: 'semester',
  periods: DEFAULT_PERIODS,
  schoolDays: [...DEFAULT_SCHOOL_DAYS],
}

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

// ============================================================================
// Logo Upload Constraints
// ============================================================================

/** Max logo file size in bytes (512 KB) */
export const LOGO_MAX_SIZE_BYTES = 512 * 1024

/** Human-readable max size label */
export const LOGO_MAX_SIZE_LABEL = '512 KB'

/** Accepted image MIME types */
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

/** Accepted file extensions for the input */
export const LOGO_ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.svg,.webp'

/** Recommended dimensions */
export const LOGO_RECOMMENDED_SIZE = '128×128px or 256×256px'
