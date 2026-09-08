/**
 * Teachers API Service
 *
 * Mock path (in-memory teachersData) + HTTP path (apiClient). VITE_USE_MOCK_API picks which runs.
 */
import type { DepartmentData, Teacher, TeacherStatistics } from '@/features/teachers/types'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId, makeId, ID_BASE } from '@/mocks/_shared'
import { teachersData } from '@/mocks/teachers/teachers'
import {
  teacherStatisticsData,
  departmentDistributionData,
} from '@/mocks/teachers/statistics'
import { teacherWorkloadData } from '@/mocks/teachers/workload'

/**
 * Fetch all teachers.
 *
 * @apiRoute GET /api/v1/teachers
 */
export async function fetchTeachers(): Promise<Teacher[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...teachersData]
    },
    async () => {
      const { data } = await apiClient.get<Teacher[]>('/teachers')
      return data
    },
  )
}

/**
 * Fetch a single teacher by id.
 *
 * @apiRoute GET /api/v1/teachers/{id}
 */
export async function fetchTeacherById(id: string): Promise<Teacher | undefined> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      return teachersData.find(t => t.id === id)
    },
    async () => {
      try {
        const { data } = await apiClient.get<Teacher>(`/teachers/${id}`)
        return data
      } catch (err: any) {
        if (err?.status === 404) return undefined
        throw err
      }
    },
  )
}

/**
 * Fetch aggregated teacher statistics (total, active, new, workload, etc.).
 *
 * @apiRoute GET /api/v1/teachers/statistics
 */
export async function fetchTeacherStatistics(): Promise<TeacherStatistics> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return { ...teacherStatisticsData }
    },
    async () => {
      const { data } = await apiClient.get<TeacherStatistics>('/teachers/statistics')
      return data
    },
  )
}

/**
 * Fetch department distribution for the workload chart.
 *
 * @apiRoute GET /api/v1/teachers/departments/distribution
 */
export async function fetchDepartmentDistribution(): Promise<DepartmentData[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      return [...departmentDistributionData]
    },
    async () => {
      const { data } = await apiClient.get<DepartmentData[]>('/teachers/departments/distribution')
      return data
    },
  )
}

/**
 * Create a new teacher.
 *
 * @apiRoute POST /api/v1/teachers
 */
export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const newTeacher: Teacher = {
        ...data,
        id: newId('tch'),
        teacherId: data.teacherId || makeId('T', ID_BASE.teacher + teachersData.length),
      } as Teacher
      teachersData.unshift(newTeacher)
      return newTeacher
    },
    async () => {
      const { data: created } = await apiClient.post<Teacher>('/teachers', data)
      return created
    },
  )
}

/**
 * Update an existing teacher.
 *
 * @apiRoute PUT /api/v1/teachers/{id}
 */
export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const index = teachersData.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Teacher not found')
      const updated = { ...teachersData[index], ...data }
      teachersData[index] = updated
      return updated
    },
    async () => {
      const { data: updated } = await apiClient.put<Teacher>(`/teachers/${id}`, data)
      return updated
    },
  )
}

/**
 * Delete a teacher by id.
 *
 * @apiRoute DELETE /api/v1/teachers/{id}
 */
export async function deleteTeacher(id: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      const index = teachersData.findIndex(t => t.id === id)
      if (index !== -1) teachersData.splice(index, 1)
    },
    async () => {
      await apiClient.delete(`/teachers/${id}`)
    },
  )
}

/**
 * Teaching hours per subject, keyed by subject name.
 *
 * @apiRoute GET /api/v1/teachers/workload
 */
export async function fetchTeacherWorkload(): Promise<typeof teacherWorkloadData> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return { ...teacherWorkloadData }
    },
    async () => {
      const { data } = await apiClient.get<typeof teacherWorkloadData>('/teachers/workload')
      return data
    },
  )
}
