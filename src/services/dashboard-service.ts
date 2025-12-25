import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { enrollmentTrendsData, attendanceOverviewData } from '@/data/mocks/student-dashboard'

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

