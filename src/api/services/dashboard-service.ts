/**
 * Dashboard API Service
 *
 * Mock path + HTTP path per endpoint.
 */
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId } from '@/mocks/_shared'
import { callerSeesEveryRow } from '@/mocks/_shared/caller'
import {
  dashboardStats,
  buildPerformanceDatasets,
  earningsDatasets,
  buildGenderDatasets,
  attendanceDatasets,
  calendarEvents,
  todoItems,
} from '@/mocks/tenant/dashboard'
import type {
  DashboardStat,
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
} from '@/features/dashboard/types'

/** @apiRoute GET /api/v1/dashboard/stats */
export async function fetchDashboardStats(): Promise<DashboardStat[]> {
  return mockOrHttp(
    async () => {
      // A school-wide figure, so there is nothing to filter — only a caller
      // who may see every student may have it summed. See `callerSeesEveryRow`,
      // which exists because the first version of this rule let a Teacher
      // holding no finance permission receive the school's fee totals.
      if (!callerSeesEveryRow('read', 'Student')) return []
      await withLatency({ min: 150, max: 350 })
      return [...dashboardStats]
    },
    async () => {
      const { data } = await apiClient.get<DashboardStat[]>('/dashboard/stats')
      return data
    },
  )
}

/**
 * @apiRoute GET /api/v1/dashboard/performance
 *
 * Guarded on Grade, not on Student. The series is marks — the grade sheet
 * summed by band — so `grades.read` is the permission it spends, and being
 * allowed to see who is on the roll is not the same as being allowed to see
 * how they did. An Accountant holds `students.read` and no grade permission,
 * and the Student guard served them the school's academic results.
 *
 * Same drift as `fetchStudentAttendance`: the aggregate was guarded on the
 * subject its *rows* are about rather than on the subject it *sums*.
 */
export async function fetchStudentPerformance(): Promise<PerformanceDataset[]> {
  return mockOrHttp(
    async () => {
      if (!callerSeesEveryRow('read', 'Grade')) return []
      await withLatency({ min: 150, max: 350 })
      // Rebuild each call so admin-configured grades appear live.
      return buildPerformanceDatasets().map(d => ({ ...d, data: [...d.data] }))
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
      // Money, so the gate is Finance rather than Student.
      if (!callerSeesEveryRow('read', 'Finance')) return []
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
      if (!callerSeesEveryRow('read', 'Student')) return []
      await withLatency({ min: 150, max: 350 })
      return buildGenderDatasets().map(d => ({ ...d, data: [...d.data] }))
    },
    async () => {
      const { data } = await apiClient.get<GenderDataset[]>('/dashboard/gender-distribution')
      return data
    },
  )
}

/**
 * @apiRoute GET /api/v1/dashboard/attendance
 *
 * Guarded on Attendance, not on Student. It sums attendance, so attendance is
 * what the caller has to be allowed to read — and the two are not the same
 * permission. An Accountant holds `students.read` and no attendance permission
 * whatsoever, and was served the school's attendance figures by the Student
 * guard: the exact failure `seesEveryRow` was written to stop, fixed for the
 * list reads and missed on this one aggregate.
 *
 * `attendance-service` has always asked for Attendance here. This is the copy
 * that drifted.
 */
export async function fetchStudentAttendance(): Promise<AttendanceDataset[]> {
  return mockOrHttp(
    async () => {
      if (!callerSeesEveryRow('read', 'Attendance')) return []
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
