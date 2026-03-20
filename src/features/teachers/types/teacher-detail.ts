import type { Teacher } from './index'

/**
 * Extended teacher detail types for the Teacher Details page
 */

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Substitute'

export interface TeacherDocument {
  id: string
  name: string
  type: string
  size: string
}

export interface ScheduleBlock {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  hour: number
  classCode: string
  variant: 'primary' | 'accent' | 'dark'
}

export interface WorkloadDataPoint {
  month: string
  totalClasses: number
  teachingHours: number
  extraDuties: number
}

export interface TrainingEvent {
  id: string
  event: string
  type: string
  date: string
  location: string
  status: 'Upcoming' | 'Completed'
}

export interface LeaveRequest {
  id: string
  type: string
  reason: string
  status: 'Pending' | 'Approved' | 'Declined'
}

export interface PerformanceMetric {
  label: string
  value: number
  max: number
  rating: string
  color: 'success' | 'info' | 'warning' | 'danger'
}

export interface CalendarHighlight {
  date: number
  variant: 'present' | 'late' | 'onLeave'
}

export interface AttendanceSummary {
  present: number
  late: number
  onLeave: number
}

export interface MonthlyAttendance {
  highlights: CalendarHighlight[]
  summary: AttendanceSummary
}

export interface TeacherDetail extends Teacher {
  employmentType: EmploymentType
  address?: string
  classAssignments?: string[]
  documents?: TeacherDocument[]
  schedule?: ScheduleBlock[]
  workloadData?: WorkloadDataPoint[]
  trainingEvents?: TrainingEvent[]
  leaveRequests?: LeaveRequest[]
  performanceMetrics?: PerformanceMetric[]
  /** Performance metrics keyed by period (e.g. 'Last Month', 'Last 3 Months') */
  performanceByPeriod?: Record<string, PerformanceMetric[]>
  /** Workload data keyed by period (e.g. 'Last 8 months', 'This month') */
  workloadByPeriod?: Record<string, WorkloadDataPoint[]>
  /** Schedule data keyed by view (e.g. 'Weekly', 'Daily') */
  scheduleByView?: Record<string, ScheduleBlock[]>
  /** Attendance data keyed by "YYYY-M" (month is 0-indexed, e.g. "2035-2" = March 2035) */
  monthlyAttendance?: Record<string, MonthlyAttendance>
}
