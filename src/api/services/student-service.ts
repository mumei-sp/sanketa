import type { Student } from '@/features/students/types'
import { studentsData } from '@/data/mocks/students'

/**
 * Mock API service for fetching students
 * Simulates network delay and returns student data
 *
 * This can be easily replaced with a real API call later
 *
 * @returns Promise resolving to array of students
 */
export async function fetchStudents(): Promise<Student[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...studentsData])
    }, delay)
  })
}

/**
 * Mock API service for fetching a single student by ID
 * Simulates network delay and returns student data
 *
 * This can be easily replaced with a real API call later
 *
 * @param id - The student ID to fetch
 * @returns Promise resolving to student data or undefined if not found
 */
export async function fetchStudentById(id: string): Promise<Student | undefined> {
  // Simulate network delay (200-500ms)
  const delay = Math.floor(Math.random() * 300) + 200

  return new Promise(resolve => {
    setTimeout(() => {
      const student = studentsData.find(s => s.id === id)
      resolve(student)
    }, delay)
  })
}
