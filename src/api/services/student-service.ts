import type { Student, ExtracurricularActivity } from '@/features/students/types'
import { studentsData } from '@/data/mocks/students'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { enrollmentTrendsData, attendanceOverviewData } from '@/data/mocks/student-dashboard'

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

/**
 * Updates a student's extracurricular activities in the mock data.
 * Used when saving from the Edit Extracurricular page so changes are visible on Student Details.
 * In a real app this would be an API call (e.g. PATCH /students/:id/extracurricular).
 *
 * @param id - Student ID to update
 * @param activities - New list of extracurricular activities
 * @returns true if student was found and updated, false otherwise
 */
export function updateStudentExtracurricular(
  id: string,
  activities: ExtracurricularActivity[],
): boolean {
  const student = studentsData.find(s => s.id === id)
  if (!student) return false
  student.extracurricularActivities = activities
  return true
}

/**
 * Mock API service for fetching enrollment trends
 * Simulates network delay and returns enrollment data
 *
 * This can be easily replaced with a real API call later
 *
 * @returns Promise resolving to array of enrollment data
 */
export async function fetchEnrollmentTrends(): Promise<EnrollmentData[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...enrollmentTrendsData])
    }, delay)
  })
}

/**
 * Mock API service for fetching attendance overview
 * Simulates network delay and returns attendance data
 *
 * This can be easily replaced with a real API call later
 *
 * @returns Promise resolving to array of attendance data
 */
export async function fetchAttendanceOverview(): Promise<AttendanceData[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...attendanceOverviewData])
    }, delay)
  })
}
