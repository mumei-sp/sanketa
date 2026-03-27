/**
 * Timetable Feature — Type Definitions
 *
 * Template-based storage: one weekly template per class,
 * exceptions stored as individual records (substitutions, cancellations).
 */

// ============================================================================
// Period Configuration (stored in SchoolConfig)
// ============================================================================

/** A single period/break slot in the school day */
export interface PeriodDefinition {
  /** Unique ID e.g. 'p1', 'break-1', 'lunch' */
  id: string
  /** Display label e.g. 'Period 1', 'Lunch Break' */
  label: string
  /** Start time in HH:mm format e.g. '08:00' */
  startTime: string
  /** End time in HH:mm format e.g. '08:45' */
  endTime: string
  /** Whether this is a break/lunch (no subject assignment) */
  isBreak: boolean
}

// ============================================================================
// Subject Registry
// ============================================================================

/** A subject that can be taught */
export interface Subject {
  /** Unique ID e.g. 'math', 'eng' */
  id: string
  /** Full name e.g. 'Mathematics' */
  name: string
  /** Short name for grid cells e.g. 'Math' */
  shortName: string
  /** Theme color token for cell tinting */
  color: string
}

// ============================================================================
// Class Section
// ============================================================================

/** A class section e.g. '9A', '5B' */
export interface ClassSection {
  /** Unique ID e.g. 'cls-9a' */
  id: string
  /** Grade level e.g. '9', '5', '1' */
  grade: string
  /** Section letter e.g. 'A', 'B', 'C' */
  section: string
  /** Display label e.g. '9A', '5B' */
  label: string
}

// ============================================================================
// Timetable Template (weekly, per class)
// ============================================================================

/** A single slot in the weekly timetable template */
export interface TimetableSlot {
  /** Day of week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat */
  dayOfWeek: number
  /** References PeriodDefinition.id */
  periodId: string
  /** Subject ID from the subject registry */
  subjectId: string
  /** Subject display name */
  subjectName: string
  /** Teacher ID (references teacher mock data) */
  teacherId: string
  /** Teacher display name */
  teacherName: string
  /** Optional room/location */
  room?: string
}

/** Weekly timetable template for one class section */
export interface ClassTimetable {
  /** Unique ID */
  id: string
  /** References ClassSection.id */
  classSectionId: string
  /** Academic year label e.g. '2035-36' */
  academicYear: string
  /** All weekly slots */
  slots: TimetableSlot[]
  /** ISO date when this template takes effect */
  effectiveFrom: string
  /** ISO date when superseded (for history tracking) */
  effectiveTo?: string
}

// ============================================================================
// Exceptions (per-date overrides)
// ============================================================================

/** Type of timetable exception */
export type TimetableExceptionType = 'substitution' | 'cancellation' | 'extra-class'

/** An exception to the regular timetable on a specific date */
export interface TimetableException {
  /** Unique ID */
  id: string
  /** References ClassSection.id */
  classSectionId: string
  /** Specific date YYYY-MM-DD */
  date: string
  /** References PeriodDefinition.id */
  periodId: string
  /** Type of exception */
  type: TimetableExceptionType
  /** Original subject name (for substitution/cancellation) */
  originalSubject?: string
  /** Original teacher name */
  originalTeacher?: string
  /** Replacement subject name (for substitution/extra-class) */
  newSubject?: string
  /** Replacement teacher ID */
  newTeacher?: string
  /** Replacement teacher display name */
  newTeacherName?: string
  /** Reason for the exception */
  reason?: string
}

// ============================================================================
// Resolved Slot (template + exceptions merged for a specific date)
// ============================================================================

/** A fully resolved slot for display — template slot with exceptions applied */
export interface ResolvedSlot {
  /** Period definition */
  period: PeriodDefinition
  /** The slot data (null if cancelled or break) */
  slot: TimetableSlot | null
  /** Exception applied to this slot (if any) */
  exception?: TimetableException
  /** Whether this period is a break */
  isBreak: boolean
  /** Whether this slot has been cancelled */
  isCancelled: boolean
  /** Whether this is a substitution */
  isSubstitution: boolean
  /** Whether this is an extra class */
  isExtraClass: boolean
}

/** Day column labels */
export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DAY_SHORT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
