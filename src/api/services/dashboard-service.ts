import {
  dashboardStats,
  performanceDatasets,
  earningsDatasets,
  genderDatasets,
  attendanceDatasets,
  calendarEvents,
  todoItems,
  recentActivityItems,
} from '@/features/dashboard/mocks'
import type {
  DashboardStat,
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
  RecentActivityItem,
} from '@/features/dashboard/types'

function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

export async function fetchDashboardStats(): Promise<DashboardStat[]> {
  await randomDelay()
  return [...dashboardStats]
}

export async function fetchStudentPerformance(): Promise<PerformanceDataset[]> {
  await randomDelay()
  return performanceDatasets.map(d => ({ ...d, data: [...d.data] }))
}

export async function fetchEarnings(): Promise<EarningsDataset[]> {
  await randomDelay()
  return earningsDatasets.map(d => ({ ...d, data: [...d.data] }))
}

export async function fetchGenderDistribution(): Promise<GenderDataset[]> {
  await randomDelay()
  return genderDatasets.map(d => ({ ...d, data: [...d.data] }))
}

export async function fetchStudentAttendance(): Promise<AttendanceDataset[]> {
  await randomDelay()
  return attendanceDatasets.map(d => ({ ...d, data: [...d.data] }))
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  await randomDelay()
  return [...calendarEvents]
}

export async function fetchTodoItems(): Promise<TodoItem[]> {
  await randomDelay()
  return [...todoItems]
}

export async function fetchRecentActivity(): Promise<RecentActivityItem[]> {
  await randomDelay()
  return [...recentActivityItems]
}
