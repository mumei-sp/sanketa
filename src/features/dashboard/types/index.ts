import type { LucideIcon } from 'lucide-react'

export interface DashboardStat {
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

export interface GradeConfig {
  key: string
  label: string
  color: string
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

export interface RecentActivityItem {
  id: string
  text: string
  timestamp: string
  dotColor: string
  icon: string
  iconBg: string
  iconColor: string
}
