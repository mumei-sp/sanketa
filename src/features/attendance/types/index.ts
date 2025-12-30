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

