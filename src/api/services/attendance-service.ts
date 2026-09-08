/**
 * Attendance API Service
 *
 * Mock path + HTTP path per endpoint.
 */
import type {
  AttendanceOverviewData,
  AttendanceRecord,
  AttendanceEntry,
  AttendanceSubmission,
  AttendanceHistoryRow,
  ClassRosterStudent,
} from '@/features/attendance/types'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { emitDomainEvent } from './notification-service'
import { withLatency, newId } from '@/mocks/_shared'
import { callerIsNarrowed, visibleToCaller } from '@/mocks/_shared/caller'
import { generateMockAttendanceData } from '@/mocks/attendance/attendance'
import { attendanceOverviewMonthlyData } from '@/mocks/attendance/overview'
import {
  classRosters,
  availableClasses,
  attendanceSubmissions,
  getSubmissionForDate,
  getWeekdaysInMonth,
} from '@/mocks/attendance/daily'

/**
 * Fetch attendance history records (N most recent business days).
 *
 * @apiRoute GET /api/v1/attendance/records?days={days}
 */
export async function fetchAttendanceRecords(days: number = 21): Promise<AttendanceRecord[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      // A school-wide figure, with no rows to narrow. For a family the honest
      // answer is not a smaller number but none: what the school collected, or
      // how it attended overall, is not their child's data in aggregate — it
      // is somebody else's, summed.
      if (callerIsNarrowed('read', 'Attendance')) return []
      return generateMockAttendanceData(days)
    },
    async () => {
      const { data } = await apiClient.get<AttendanceRecord[]>('/attendance/records', {
        params: { days },
      })
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Daily attendance marking
// ---------------------------------------------------------------------------

/** @apiRoute GET /api/v1/classes */
export async function fetchAvailableClasses(): Promise<string[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return [...availableClasses]
    },
    async () => {
      const { data } = await apiClient.get<string[]>('/classes')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/classes/{classId}/roster */
export async function fetchClassRoster(classId: string): Promise<ClassRosterStudent[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 400 })
      const roster = classRosters[classId]
      if (!roster) throw new Error(`Class "${classId}" not found`)
      // Roster rows carry `Student.id` since the rosters were reconciled, so a
      // family narrowed to their own child receives that child's row and no
      // one else's. Filler rows in classes with no enrolment carry an id no
      // scope can match, so a narrowed caller sees none of them — which is
      // correct: nobody's child is in a filler class.
      return visibleToCaller([...roster], 'read', 'Student', student => ({
        studentId: student.id,
        classSection: classId,
      }))
    },
    async () => {
      const { data } = await apiClient.get<ClassRosterStudent[]>(`/classes/${classId}/roster`)
      return data
    },
  )
}

/**
 * Fetch an existing attendance submission for a class + date (null when not submitted).
 *
 * @apiRoute GET /api/v1/attendance/submissions?classId={classId}&date={date}
 */
export async function fetchAttendanceSubmission(
  classId: string,
  date: string,
): Promise<AttendanceSubmission | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 400 })
      const submission = getSubmissionForDate(classId, date)
      if (!submission) return null
      // Same class shape as a grade submission: the register belongs to the
      // class, the lines belong to students.
      const entries = visibleToCaller(
        [...submission.entries],
        'read',
        'Attendance',
        entry => ({ studentId: entry.studentId, classSection: classId }),
      )
      return { ...submission, entries }
    },
    async () => {
      try {
        const { data } = await apiClient.get<AttendanceSubmission>('/attendance/submissions', {
          params: { classId, date },
        })
        return data
      } catch (err: any) {
        if (err?.status === 404) return null
        throw err
      }
    },
  )
}

/**
 * Submit or update attendance for a class + date.
 *
 * @apiRoute POST /api/v1/attendance/submissions
 */
export async function submitAttendance(
  classId: string,
  date: string,
  entries: AttendanceEntry[],
  submittedBy: string,
): Promise<AttendanceSubmission> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const existing = getSubmissionForDate(classId, date)
      const submission: AttendanceSubmission = {
        id: existing?.id ?? newId(`sub-${classId}-${date}`),
        classId,
        date,
        entries: [...entries],
        submittedBy: existing?.submittedBy ?? submittedBy,
        submittedAt: existing?.submittedAt ?? new Date().toISOString(),
        lastEditedBy: existing ? submittedBy : undefined,
        lastEditedAt: existing ? new Date().toISOString() : undefined,
      }
      const idx = attendanceSubmissions.findIndex(s => s.classId === classId && s.date === date)
      if (idx >= 0) attendanceSubmissions[idx] = submission
      else attendanceSubmissions.push(submission)
      emitDomainEvent({
        type: 'attendance.submitted',
        payload: {
          submissionId: submission.id,
          className: classId,
          date,
          presentCount: entries.filter(e => e.status === 'present').length,
          absentCount: entries.filter(e => e.status === 'absent').length,
        },
      })
      return submission
    },
    async () => {
      const { data } = await apiClient.post<AttendanceSubmission>('/attendance/submissions', {
        classId,
        date,
        entries,
        submittedBy,
      })
      return data
    },
  )
}

/**
 * Fetch attendance history rows for a class in a given month.
 *
 * @apiRoute GET /api/v1/attendance/history?classId={classId}&year={year}&month={month}
 */
export async function fetchAttendanceHistory(
  classId: string,
  year: number,
  month: number,
): Promise<AttendanceHistoryRow[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 400 })
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
      // Reverse so most recent first.
      return rows.reverse()
    },
    async () => {
      const { data } = await apiClient.get<AttendanceHistoryRow[]>('/attendance/history', {
        params: { classId, year, month },
      })
      return data
    },
  )
}

/**
 * Monthly attendance percentages for the overview chart.
 *
 * @apiRoute GET /api/v1/attendance/overview/monthly
 */
export async function fetchAttendanceOverviewMonthly(): Promise<AttendanceOverviewData[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...attendanceOverviewMonthlyData]
    },
    async () => {
      const { data } = await apiClient.get<AttendanceOverviewData[]>(
        '/attendance/overview/monthly',
      )
      return data
    },
  )
}
