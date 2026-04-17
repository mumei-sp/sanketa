/**
 * Dashboard API Service
 *
 * Mock path + HTTP path per endpoint.
 */
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId } from '@/mocks/_shared'
import {
  dashboardStats,
  performanceDatasets,
  earningsDatasets,
  genderDatasets,
  attendanceDatasets,
  calendarEvents,
  todoItems,
  recentActivityItems,
} from '@/mocks/dashboard'
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

/** @apiRoute GET /api/v1/dashboard/stats */
export async function fetchDashboardStats(): Promise<DashboardStat[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return [...dashboardStats]
    },
    async () => {
      const { data } = await apiClient.get<DashboardStat[]>('/dashboard/stats')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/performance */
export async function fetchStudentPerformance(): Promise<PerformanceDataset[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return performanceDatasets.map(d => ({ ...d, data: [...d.data] }))
    },
    async () => {
      const { data } = await apiClient.get<PerformanceDataset[]>('/dashboard/performance')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/earnings */
export async function fetchEarnings(): Promise<EarningsDataset[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return earningsDatasets.map(d => ({ ...d, data: [...d.data] }))
    },
    async () => {
      const { data } = await apiClient.get<EarningsDataset[]>('/dashboard/earnings')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/gender-distribution */
export async function fetchGenderDistribution(): Promise<GenderDataset[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return genderDatasets.map(d => ({ ...d, data: [...d.data] }))
    },
    async () => {
      const { data } = await apiClient.get<GenderDataset[]>('/dashboard/gender-distribution')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/attendance */
export async function fetchStudentAttendance(): Promise<AttendanceDataset[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return attendanceDatasets.map(d => ({ ...d, data: [...d.data] }))
    },
    async () => {
      const { data } = await apiClient.get<AttendanceDataset[]>('/dashboard/attendance')
      return data
    },
  )
}

/**
 * Upcoming events shown on the dashboard.
 *
 * Separate from the full calendar service — the dashboard only needs a small
 * hand-picked list for its sidebar widget.
 *
 * @apiRoute GET /api/v1/dashboard/events
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return [...calendarEvents]
    },
    async () => {
      const { data } = await apiClient.get<CalendarEvent[]>('/dashboard/events')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/todos */
export async function fetchTodoItems(): Promise<TodoItem[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return [...todoItems]
    },
    async () => {
      const { data } = await apiClient.get<TodoItem[]>('/dashboard/todos')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/dashboard/recent-activity */
export async function fetchRecentActivity(): Promise<RecentActivityItem[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      return [...recentActivityItems]
    },
    async () => {
      const { data } = await apiClient.get<RecentActivityItem[]>('/dashboard/recent-activity')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/dashboard/todos */
export async function createTodoItem(data: { text: string; date: string }): Promise<TodoItem> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      const newItem: TodoItem = {
        id: newId('todo'),
        text: data.text,
        date: data.date,
        completed: false,
      }
      todoItems.push(newItem)
      return { ...newItem }
    },
    async () => {
      const { data: created } = await apiClient.post<TodoItem>('/dashboard/todos', data)
      return created
    },
  )
}

/** @apiRoute PUT /api/v1/dashboard/todos/{id} */
export async function updateTodoItem(
  id: string,
  data: Partial<Pick<TodoItem, 'text' | 'date' | 'completed'>>,
): Promise<TodoItem> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      const item = todoItems.find(t => t.id === id)
      if (!item) throw new Error(`Todo item not found: ${id}`)
      if (data.text !== undefined) item.text = data.text
      if (data.date !== undefined) item.date = data.date
      if (data.completed !== undefined) item.completed = data.completed
      return { ...item }
    },
    async () => {
      const { data: updated } = await apiClient.put<TodoItem>(`/dashboard/todos/${id}`, data)
      return updated
    },
  )
}

/** @apiRoute DELETE /api/v1/dashboard/todos/{id} */
export async function deleteTodoItem(id: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      const index = todoItems.findIndex(t => t.id === id)
      if (index !== -1) todoItems.splice(index, 1)
    },
    async () => {
      await apiClient.delete(`/dashboard/todos/${id}`)
    },
  )
}
