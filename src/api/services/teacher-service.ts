import type { Teacher } from '@/features/teachers/types'
import { teachersData } from '@/mocks/teachers/teachers'
import {
  teacherStatisticsData,
  departmentDistributionData,
  type TeacherStatistics,
  type DepartmentData,
} from '@/mocks/teachers/statistics'

/**
 * Mock API service for fetching teachers
 * Simulates network delay and returns teacher data
 *
 * This can be easily replaced with a real API call later
 *
 * @returns Promise resolving to array of teachers
 */
export async function fetchTeachers(): Promise<Teacher[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...teachersData])
    }, delay)
  })
}

/**
 * Mock API service for fetching a single teacher by ID
 * Simulates network delay and returns teacher data
 *
 * This can be easily replaced with a real API call later
 *
 * @param id - The teacher ID to fetch
 * @returns Promise resolving to teacher data or undefined if not found
 */
export async function fetchTeacherById(id: string): Promise<Teacher | undefined> {
  // Simulate network delay (200-500ms)
  const delay = Math.floor(Math.random() * 300) + 200

  return new Promise(resolve => {
    setTimeout(() => {
      const teacher = teachersData.find(t => t.id === id)
      resolve(teacher)
    }, delay)
  })
}

/**
 * Mock API service for fetching teacher statistics
 * Simulates network delay and returns teacher statistics data
 *
 * This can be easily replaced with a real API call later
 *
 * @returns Promise resolving to teacher statistics
 */
export async function fetchTeacherStatistics(): Promise<TeacherStatistics> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ ...teacherStatisticsData })
    }, delay)
  })
}

/**
 * Mock API service for creating a new teacher
 *
 * Replace with: POST /api/teachers
 */
export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      const newTeacher: Teacher = {
        ...data,
        id: `tch-${Date.now()}`,
        teacherId: data.teacherId || `T-${Math.floor(1000 + Math.random() * 9000)}`,
      } as Teacher

      teachersData.unshift(newTeacher)
      resolve(newTeacher)
    }, delay)
  })
}

/**
 * Mock API service for updating an existing teacher
 *
 * Replace with: PUT /api/teachers/:id
 */
export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = teachersData.findIndex(t => t.id === id)
      if (index === -1) {
        reject(new Error('Teacher not found'))
        return
      }

      const updated = { ...teachersData[index], ...data }
      teachersData[index] = updated
      resolve(updated)
    }, delay)
  })
}

/**
 * Mock API service for deleting a teacher by ID
 * Simulates network delay and removes teacher from mock data
 *
 * @param id - The teacher ID to delete
 */
export async function deleteTeacher(id: string): Promise<void> {
  // Simulate network delay (200-500ms)
  const delay = Math.floor(Math.random() * 300) + 200

  return new Promise(resolve => {
    setTimeout(() => {
      const index = teachersData.findIndex(t => t.id === id)
      if (index !== -1) {
        teachersData.splice(index, 1)
      }
      resolve()
    }, delay)
  })
}

/**
 * Mock API service for fetching department distribution
 */
export async function fetchDepartmentDistribution(): Promise<DepartmentData[]> {
  const delay = Math.floor(Math.random() * 300) + 200

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...departmentDistributionData])
    }, delay)
  })
}
