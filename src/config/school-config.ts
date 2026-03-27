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

  // ── Grading ──
  /** Grade scale configuration */
  grading: GradingConfig
}

/** A single period/break slot in the school day (re-exported from timetable types for convenience) */
export interface PeriodDefinition {
  id: string
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

// ── Grading ──

/** A single row in the grade scale table */
export interface GradeScaleEntry {
  /** Unique identifier */
  id: string
  /** Grade label (e.g., "A1", "1", or empty for percentage-only) */
  label: string
  /** Minimum percentage for this grade (0-100) */
  minPercent: number
  /** Maximum percentage for this grade (0-100) */
  maxPercent: number
  /** Grade points awarded (e.g., 10 for A1 in CBSE) */
  gradePoints: number
  /** Human-readable description (e.g., "Outstanding") */
  description: string
}

/** Available grading system presets */
export type GradeScalePreset = 'cbse' | 'icse' | 'percentage' | 'custom'

/** Complete grading configuration */
export interface GradingConfig {
  /** Which preset is active (tracks origin, does not lock editing) */
  preset: GradeScalePreset
  /** The grade scale entries (editable regardless of preset) */
  entries: GradeScaleEntry[]
  /** Minimum passing percentage */
  passingThreshold: number
}

// ============================================================================
// Defaults
// ============================================================================

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

// ── Grade Scale Presets ──

/** CBSE 9-point grading scale (A1–E2) */
export const CBSE_GRADE_SCALE: GradeScaleEntry[] = [
  { id: 'cbse-a1', label: 'A1', minPercent: 91, maxPercent: 100, gradePoints: 10, description: 'Outstanding' },
  { id: 'cbse-a2', label: 'A2', minPercent: 81, maxPercent: 90,  gradePoints: 9,  description: 'Excellent' },
  { id: 'cbse-b1', label: 'B1', minPercent: 71, maxPercent: 80,  gradePoints: 8,  description: 'Very Good' },
  { id: 'cbse-b2', label: 'B2', minPercent: 61, maxPercent: 70,  gradePoints: 7,  description: 'Good' },
  { id: 'cbse-c1', label: 'C1', minPercent: 51, maxPercent: 60,  gradePoints: 6,  description: 'Above Average' },
  { id: 'cbse-c2', label: 'C2', minPercent: 41, maxPercent: 50,  gradePoints: 5,  description: 'Average' },
  { id: 'cbse-d',  label: 'D',  minPercent: 33, maxPercent: 40,  gradePoints: 4,  description: 'Below Average' },
  { id: 'cbse-e1', label: 'E1', minPercent: 21, maxPercent: 32,  gradePoints: 3,  description: 'Needs Improvement' },
  { id: 'cbse-e2', label: 'E2', minPercent: 0,  maxPercent: 20,  gradePoints: 2,  description: 'Poor' },
]

/** ICSE 9-point grading scale (1–9) */
export const ICSE_GRADE_SCALE: GradeScaleEntry[] = [
  { id: 'icse-1', label: '1', minPercent: 90, maxPercent: 100, gradePoints: 10, description: 'Exceptional' },
  { id: 'icse-2', label: '2', minPercent: 80, maxPercent: 89,  gradePoints: 9,  description: 'Very Good' },
  { id: 'icse-3', label: '3', minPercent: 70, maxPercent: 79,  gradePoints: 8,  description: 'Good' },
  { id: 'icse-4', label: '4', minPercent: 60, maxPercent: 69,  gradePoints: 7,  description: 'Satisfactory' },
  { id: 'icse-5', label: '5', minPercent: 50, maxPercent: 59,  gradePoints: 6,  description: 'Average' },
  { id: 'icse-6', label: '6', minPercent: 40, maxPercent: 49,  gradePoints: 5,  description: 'Below Average' },
  { id: 'icse-7', label: '7', minPercent: 33, maxPercent: 39,  gradePoints: 4,  description: 'Needs Improvement' },
  { id: 'icse-8', label: '8', minPercent: 21, maxPercent: 32,  gradePoints: 3,  description: 'Unsatisfactory' },
  { id: 'icse-9', label: '9', minPercent: 0,  maxPercent: 20,  gradePoints: 0,  description: 'Fail' },
]

/** Available grade scale presets for the settings UI */
export const GRADE_SCALE_PRESET_OPTIONS: {
  value: GradeScalePreset
  label: string
  description: string
}[] = [
  { value: 'cbse',       label: 'CBSE 9-Point',   description: 'A1–E2 scale used by CBSE board schools' },
  { value: 'icse',       label: 'ICSE 9-Point',   description: '1–9 numeric scale used by ICSE board schools' },
  { value: 'percentage', label: 'Percentage Only', description: 'No grade labels — scores as percentages' },
  { value: 'custom',     label: 'Custom',          description: 'Define your own grading scale' },
]

/** Default grading config — CBSE preset with 33% pass threshold */
export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  preset: 'cbse',
  entries: CBSE_GRADE_SCALE.map(e => ({ ...e })),
  passingThreshold: 33,
}

/** Default config — used on first load and for "Reset to Defaults" */
export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'Sanketa School',
  schoolLogo: null,
  academicYearStartMonth: 3,
  termStructure: 'semester',
  periods: DEFAULT_PERIODS,
  schoolDays: [...DEFAULT_SCHOOL_DAYS],
  grading: { ...DEFAULT_GRADING_CONFIG, entries: DEFAULT_GRADING_CONFIG.entries.map(e => ({ ...e })) },
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
