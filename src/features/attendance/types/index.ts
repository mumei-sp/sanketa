/**
 * Type definitions for attendance records and table data
 */

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'na'

export type AttendanceRecordType = 'student' | 'teacher' | 'staff'

/**
 * Attendance record interface representing a person's attendance data
 */
export interface AttendanceRecord {
  /** Unique identifier */
  id: string
  /** Student/Teacher/Staff ID */
  studentId?: string
  teacherId?: string
  staffId?: string
  /** Full name */
  name: string
  /** Type of record */
  type: AttendanceRecordType
  /** Class (for students only) */
  class?: string
  /** Avatar URL */
  avatarUrl?: string
  /** Attendance status for each date (date string as key, e.g., "2025-03-01") */
  attendance: Record<string, AttendanceStatus>
}

/**
 * Table row data type for attendance table
 */
export type AttendanceTableData = AttendanceRecord

/**
 * Date range preset options
 */
export type DateRangePreset = 'last-14-days' | 'last-30-days' | 'this-month' | 'last-month' | 'custom'

/**
 * Date range interface for filtering attendance data
 */
export interface DateRange {
  /** Start date in YYYY-MM-DD format, null means no start limit */
  startDate: string | null
  /** End date in YYYY-MM-DD format, null means no end limit */
  endDate: string | null
  /** Optional preset identifier */
  preset?: DateRangePreset
}

/**
 * Attendance overview data for chart display (monthly percentages)
 */
export interface AttendanceOverviewData {
  /** Month abbreviation (e.g., "Jan", "Feb", "Mar") */
  month: string
  /** Students attendance percentage (0-100) */
  students: number
  /** Teachers attendance percentage (0-100) */
  teachers: number
  /** Staff attendance percentage (0-100) */
  staff: number
}

// ============================================================================
// Daily Attendance Marking Types
// ============================================================================

/** Markable attendance status (excludes 'na' which is only for weekends) */
export type MarkableAttendanceStatus = 'present' | 'late' | 'absent'

/** A single student's attendance entry for one day */
export interface AttendanceEntry {
  /** Student ID */
  studentId: string
  /** Attendance status */
  status: MarkableAttendanceStatus
  /** Optional note/reason (e.g., "Late bus", "Sick leave") */
  note?: string
}

/** A submitted attendance record for a class on a date */
export interface AttendanceSubmission {
  /** Unique submission ID */
  id: string
  /** Class identifier (e.g., '9A') */
  classId: string
  /** Date in YYYY-MM-DD format */
  date: string
  /** Per-student attendance entries */
  entries: AttendanceEntry[]
  /** Name of the teacher/admin who submitted */
  submittedBy: string
  /** ISO timestamp of submission */
  submittedAt: string
  /** Name of last editor (if different from submitter) */
  lastEditedBy?: string
  /** ISO timestamp of last edit */
  lastEditedAt?: string
}

/** Student roster item for the marking interface */
export interface ClassRosterStudent {
  /** Unique student ID */
  id: string
  /** Full name */
  name: string
  /** Roll number */
  rollNumber: string
  /** Avatar URL */
  avatarUrl?: string
}

/** Summary row for the attendance history table */
export interface AttendanceHistoryRow {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Number of students marked present */
  present: number
  /** Number of students marked late */
  late: number
  /** Number of students marked absent */
  absent: number
  /** Total students in class */
  total: number
  /** Who submitted the attendance */
  submittedBy: string
  /** When it was submitted (ISO timestamp) */
  submittedAt: string
  /** Whether attendance has been submitted for this date */
  isSubmitted: boolean
}

