import type { AttendanceOverviewData } from '@/features/attendance/types'
import { MONTH_SHORT_LABELS } from '@/config/school-config'

/**
 * Monthly attendance percentages for the term so far.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Six hardcoded months, January to June, with student attendance running 50%,
 * 78%, 75%, 60%, 72%, 78%. Half the school absent in January is not a school
 * having a quiet month, it is a school that has closed; and the months were
 * the wrong ones — the academic year starts in April, so a chart labelled
 * "Last Semester" in September was showing the previous year's second term.
 *
 * Now: the six months up to and including this one, at rates a school
 * actually runs at. Attendance dips in the monsoon and around exam leave and
 * recovers after; staff attendance sits a little above the students', which is
 * the usual shape, and support staff a little below both.
 */

/** Six months ending with the current one, in the order a chart reads them. */
function recentMonths(count = 6, base: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const index = (base.getMonth() - (count - 1 - i) + 12) % 12
    return MONTH_SHORT_LABELS[index]
  })
}

/**
 * The shape of a term, oldest first.
 *
 * Deliberately not flat and not noise: the first month back is high, the
 * monsoon months sag, and the month before an exam recovers. A chart of six
 * identical bars and a chart of six random ones are both read as "no data".
 */
const SHAPE: readonly { students: number; teachers: number; staff: number }[] = [
  { students: 95, teachers: 97, staff: 93 },
  { students: 93, teachers: 96, staff: 92 },
  { students: 89, teachers: 95, staff: 90 },
  { students: 87, teachers: 94, staff: 89 },
  { students: 91, teachers: 96, staff: 92 },
  { students: 94, teachers: 97, staff: 93 },
]

export const attendanceOverviewMonthlyData: AttendanceOverviewData[] = recentMonths().map(
  (month, i) => ({ month, ...SHAPE[i] }),
)
