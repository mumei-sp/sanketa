import type { AttendanceRecord } from '@/features/attendance/types'
import { generateMockAttendanceData } from '@/data/mocks/attendance'

/**
 * Mock API service for fetching attendance records
 * Simulates network delay and returns attendance data
 *
 * This can be easily replaced with a real API call later
 *
 * @param days - Number of days to fetch attendance for (default: 21)
 * @returns Promise resolving to array of attendance records
 */
export async function fetchAttendanceRecords(days: number = 21): Promise<AttendanceRecord[]> {
  // Simulate network delay (300-800ms)
  const delay = Math.floor(Math.random() * 500) + 300

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(generateMockAttendanceData(days))
    }, delay)
  })
}
