import type { LucideIcon } from 'lucide-react'

export interface DashboardStat {
  /** Unique identifier for the stat tile */
  id: string
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
  /** Short description for the customize modal */
  description?: string
}

export interface GradeConfig {
  /** Data-row key (e.g. "grade7") */
  key: string
  /** Display label (e.g. "Grade 7") */
  label: string
  /** Series color */
  color: string
  /**
   * Optional per-section breakdown. When present, consumers that opt into
   * section-level drill-down can render these series in place of the parent
   * grade series. Each entry's `key` is the section label ("7A", "7B", ...)
   * and must also appear as a column in the sibling `PerformanceDataset.data`
   * rows so the chart can bind to it.
   */
  sections?: {
    /** Data-row key (same as the section label, e.g. "7A") */
    key: string
    /** Display label (e.g. "Class 7A") */
    label: string
    /** Series color (distinct from the parent grade so bars read apart) */
    color: string
  }[]
}

export interface PerformanceDataset {
  label: string
  value: string
  grades: GradeConfig[]
  data: Record<string, string | number>[]
}

export interface EarningsData {
  month: string
  earnings: number
  expenses: number
}

export interface EarningsDataset {
  label: string
  value: string
  data: EarningsData[]
}

export interface GenderDistribution {
  label: string
  value: number
  color: string
}

export interface GenderDataset {
  label: string
  value: string
  data: GenderDistribution[]
}

export interface StudentAttendanceData {
  day: string
  count: number
}

export interface AttendanceDataset {
  label: string
  value: string
  data: StudentAttendanceData[]
}

export interface CalendarEvent {
  id: string
  date: string
  startTime: string
  endTime: string
  title: string
  subtitle: string
  color: string
  bgColor: string
}

export interface TodoItem {
  id: string
  text: string
  date: string
  completed: boolean
}

export interface NoticeBoardItem {
  id: string
  title: string
  tag: string
  tagColor: string
  audience: string
  date: string
  createdBy: string
}

