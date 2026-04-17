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

export async function createTodoItem(data: { text: string; date: string }): Promise<TodoItem> {
  await randomDelay()
  const newItem: TodoItem = {
    id: `todo-${Date.now()}`,
    text: data.text,
    date: data.date,
    completed: false,
  }
  todoItems.push(newItem)
  return { ...newItem }
}

export async function updateTodoItem(
  id: string,
  data: Partial<Pick<TodoItem, 'text' | 'date' | 'completed'>>,
): Promise<TodoItem> {
  await randomDelay()
  const item = todoItems.find(t => t.id === id)
  if (!item) throw new Error(`Todo item not found: ${id}`)
  if (data.text !== undefined) item.text = data.text
  if (data.date !== undefined) item.date = data.date
  if (data.completed !== undefined) item.completed = data.completed
  return { ...item }
}

export async function deleteTodoItem(id: string): Promise<void> {
  await randomDelay()
  const index = todoItems.findIndex(t => t.id === id)
  if (index !== -1) todoItems.splice(index, 1)
}
