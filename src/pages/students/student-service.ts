import type { Student } from './student-types'
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

