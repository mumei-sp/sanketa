import type { Student, StudentDetailData } from '@/features/students/types'
import { studentsData } from '@/data/mocks/students'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { enrollmentTrendsData, attendanceOverviewData } from '@/data/mocks/student-dashboard'
import { studentDetailData } from '@/data/mocks/student-details'

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
/**
 * Mock API service for fetching student detail data (attendance, scholarships, etc.)
 *
 * Replace with a real API call: GET /api/students/:id/details
 *
 * @param id - The student ID
 * @returns Promise resolving to student detail data
 */
/**
 * Mock API service for creating a new student
 *
 * Replace with: POST /api/students
 */
export async function createStudent(data: Partial<Student>): Promise<Student> {
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      const newStudent: Student = {
        ...data,
        id: `stu-${Date.now()}`,
        studentId: data.studentId || `S-${Math.floor(1000 + Math.random() * 9000)}`,
        gpa: data.gpa ?? 0,
        performance: data.performance ?? 'Good',
        percentage: data.percentage ?? 0,
        status: data.status ?? 'Active',
      } as Student

      studentsData.unshift(newStudent)
      resolve(newStudent)
    }, delay)
  })
}

/**
 * Mock API service for updating an existing student
 *
 * Replace with: PUT /api/students/:id
 */
export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = studentsData.findIndex(s => s.id === id)
      if (index === -1) {
        reject(new Error('Student not found'))
        return
      }

      const updated = { ...studentsData[index], ...data }
      studentsData[index] = updated
      resolve(updated)
    }, delay)
  })
}

export async function fetchStudentDetailData(_id: string): Promise<StudentDetailData> {
  const delay = Math.floor(Math.random() * 300) + 200

  return new Promise(resolve => {
    setTimeout(() => {
      // Currently returns the same mock data for all students.
      // When the backend is ready, this will fetch per-student detail data.
      resolve(studentDetailData)
    }, delay)
  })
}

export async function fetchAttendanceOverview(): Promise<AttendanceData[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...attendanceOverviewData])
    }, delay)
  })
}
