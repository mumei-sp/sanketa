import type { AttendanceRecord, AttendanceStatus } from '@/features/attendance/types'
import { listStudents } from '@/mocks/students'
import { teachersData } from '@/mocks/teachers/teachers'
import { classSectionOf } from '@/utils/class-section-helpers'
import { getDisplayName } from '@/features/students/utils/formatting'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, type Rng } from '@/mocks/tenants/_generate/random'

/**
 * The attendance register that the overview screen reads.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * A cast of eighteen students written out here by hand — Emma Williams,
 * Thomas Green, Isabella Rodriguez — none of whom were in the student
 * directory, plus five teachers (Dr. Sarah Johnson, Prof. Robert Smith) who
 * were not on the staff list and four support staff who were not anywhere. So
 * the attendance screen was about a different school from every other screen,
 * and the ids on its rows (`1`, `t1`, `s1`) pointed at nothing.
 *
 * That mattered beyond tidiness. A parent's scope narrows attendance to their
 * own child by student id; against a parallel cast it matched nobody, and the
 * empty result looked like the filter working.
 *
 * Statuses come off a seeded stream rather than `Math.random`, so a register
 * does not rewrite itself between two views of the same day.
 */

/**
 * Generate date strings for the last N calendar days
 */
function getLastNDays(n: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
    dates.push(dateStr)
  }

  return dates
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Roll one person's attendance across the range.
 *
 * Absence rates differ by who you are: children are off more than staff, and
 * staff are off more than they are late. One shared probability made teachers
 * as absent as their pupils.
 */
function rollAttendance(
  source: Rng,
  dates: string[],
  absentRate: number,
  lateRate: number,
): Record<string, AttendanceStatus> {
  const attendance: Record<string, AttendanceStatus> = {}
  dates.forEach(dateStr => {
    if (isWeekend(dateStr)) {
      attendance[dateStr] = 'na'
      return
    }
    const roll = source()
    attendance[dateStr] = roll < absentRate ? 'absent' : roll < absentRate + lateRate ? 'late' : 'present'
  })
  return attendance
}

/**
 * Support staff.
 *
 * The one group with no table of its own — the schema has `staff` but the mock
 * has never seeded it, so these four are still written out. Named as the rest
 * of the school is named, at least, and flagged here so it is clear this is
 * the gap and not a design.
 */
const SUPPORT_STAFF: readonly { id: string; staffId: string; name: string }[] = [
  { id: 'st-1', staffId: 'ST-2001', name: 'Shivanna Gowda' },
  { id: 'st-2', staffId: 'ST-2002', name: 'Lalitha Bai' },
  { id: 'st-3', staffId: 'ST-2003', name: 'Peter Fernandes' },
  { id: 'st-4', staffId: 'ST-2004', name: 'Nagaveni Shetty' },
]

/**
 * Attendance for the last N days, for students, teachers and support staff.
 *
 * The student rows are the directory's own rows, so a scope narrowed to one
 * child finds that child here. Twenty-four of them rather than all four
 * hundred: this feeds a summary table that is read by eye, and the register a
 * teacher marks is `daily.ts`, which covers everybody.
 */
export function generateMockAttendanceData(days: number = 10): AttendanceRecord[] {
  const dateRange = getLastNDays(days)
  const records: AttendanceRecord[] = []
  const source = rng(`${activeTenant()}:attendance-overview:${days}`)

  listStudents()
    .slice(0, 24)
    .forEach(student => {
      const name = getDisplayName(student)
      records.push({
        id: String(student.id),
        studentId: student.studentId,
        name,
        type: 'student',
        class: classSectionOf(student),
        avatarUrl:
          student.profilePictureUrl ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        attendance: rollAttendance(source, dateRange, 0.07, 0.05),
      })
    })

  teachersData.slice(0, 6).forEach(teacher => {
    const name = teacher.fullName ?? teacher.displayName ?? teacher.teacherId
    records.push({
      id: `t-${teacher.id}`,
      teacherId: teacher.teacherId,
      name,
      type: 'teacher',
      avatarUrl:
        teacher.avatarUrl ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      attendance: rollAttendance(source, dateRange, 0.04, 0.02),
    })
  })

  SUPPORT_STAFF.forEach(staff => {
    records.push({
      id: staff.id,
      staffId: staff.staffId,
      name: staff.name,
      type: 'staff',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.name)}`,
      attendance: rollAttendance(source, dateRange, 0.06, 0.03),
    })
  })

  return records
}

/**
 * Mock attendance data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */
export const attendanceData: AttendanceRecord[] = generateMockAttendanceData(21)

