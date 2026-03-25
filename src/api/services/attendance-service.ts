import type {
  AttendanceRecord,
  AttendanceEntry,
  AttendanceSubmission,
  AttendanceHistoryRow,
  ClassRosterStudent,
} from '@/features/attendance/types'
import { generateMockAttendanceData } from '@/data/mocks/attendance'
import {
  classRosters,
  availableClasses,
  attendanceSubmissions,
  getSubmissionForDate,
  getWeekdaysInMonth,
} from '@/data/mocks/attendance-daily'

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

// ============================================================================
// Daily Attendance Marking Services
// ============================================================================

/**
 * Fetch the list of available class IDs
 *
 * Replace with: GET /api/classes
 */
export async function fetchAvailableClasses(): Promise<string[]> {
  const delay = Math.floor(Math.random() * 200) + 100
  return new Promise(resolve => {
    setTimeout(() => resolve([...availableClasses]), delay)
  })
}

/**
 * Fetch student roster for a specific class
 *
 * Replace with: GET /api/classes/:classId/roster
 */
export async function fetchClassRoster(classId: string): Promise<ClassRosterStudent[]> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const roster = classRosters[classId]
      if (!roster) {
        reject(new Error(`Class "${classId}" not found`))
        return
      }
      resolve([...roster])
    }, delay)
  })
}

/**
 * Fetch an existing attendance submission for a class + date
 * Returns null if not yet submitted
 *
 * Replace with: GET /api/attendance/submissions?classId=X&date=Y
 */
export async function fetchAttendanceSubmission(
  classId: string,
  date: string,
): Promise<AttendanceSubmission | null> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => {
    setTimeout(() => {
      const submission = getSubmissionForDate(classId, date)
      resolve(submission ? { ...submission, entries: [...submission.entries] } : null)
    }, delay)
  })
}

/**
 * Submit or update attendance for a class + date
 *
 * Replace with: POST /api/attendance/submissions
 */
export async function submitAttendance(
  classId: string,
  date: string,
  entries: AttendanceEntry[],
  submittedBy: string,
): Promise<AttendanceSubmission> {
  const delay = Math.floor(Math.random() * 500) + 300
  return new Promise(resolve => {
    setTimeout(() => {
      const existing = getSubmissionForDate(classId, date)
      const submission: AttendanceSubmission = {
        id: existing?.id ?? `sub-${classId}-${date}-${Date.now()}`,
        classId,
        date,
        entries: [...entries],
        submittedBy: existing?.submittedBy ?? submittedBy,
        submittedAt: existing?.submittedAt ?? new Date().toISOString(),
        lastEditedBy: existing ? submittedBy : undefined,
        lastEditedAt: existing ? new Date().toISOString() : undefined,
      }

      // Update in-memory mock store
      const idx = attendanceSubmissions.findIndex(s => s.classId === classId && s.date === date)
      if (idx >= 0) {
        attendanceSubmissions[idx] = submission
      } else {
        attendanceSubmissions.push(submission)
      }

      resolve(submission)
    }, delay)
  })
}

/**
 * Fetch attendance history rows for a class in a given month
 *
 * Replace with: GET /api/attendance/history?classId=X&year=Y&month=Z
 */
export async function fetchAttendanceHistory(
  classId: string,
  year: number,
  month: number,
): Promise<AttendanceHistoryRow[]> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => {
    setTimeout(() => {
      const weekdays = getWeekdaysInMonth(year, month)
      const roster = classRosters[classId]
      const total = roster?.length ?? 0

      const rows: AttendanceHistoryRow[] = weekdays.map(date => {
        const sub = getSubmissionForDate(classId, date)
        if (sub) {
          const present = sub.entries.filter(e => e.status === 'present').length
          const late = sub.entries.filter(e => e.status === 'late').length
          const absent = sub.entries.filter(e => e.status === 'absent').length
          return {
            date,
            present,
            late,
            absent,
            total,
            submittedBy: sub.submittedBy,
            submittedAt: sub.submittedAt,
            isSubmitted: true,
          }
        }
        return {
          date,
          present: 0,
          late: 0,
          absent: 0,
          total,
          submittedBy: '',
          submittedAt: '',
          isSubmitted: false,
        }
      })

      // Reverse so most recent first
      resolve(rows.reverse())
    }, delay)
  })
}
