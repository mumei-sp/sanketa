import type { AttendanceData, EnrollmentData } from '@/data/dashboard'
import { studentsData } from './students'
import { SCHOOL_SCALE } from '@/mocks/_shared/constants'

/**
 * Derived from studentsData so a change to the roster ripples through the
 * Students dashboard widgets instead of drifting out of sync.
 */
const TOTAL_ENROLLMENT = studentsData.length * SCHOOL_SCALE.enrollmentMultiplier
const DAILY_PRESENT_AVG = Math.round(TOTAL_ENROLLMENT * SCHOOL_SCALE.attendanceRate)
const clamp = (n: number) => Math.min(TOTAL_ENROLLMENT, Math.max(0, Math.round(n)))

/**
 * Weekly attendance (two consecutive weeks of data). Weekend days show
 * noticeably lower counts — boarding / activity-only students.
 */
export const attendanceOverviewData: AttendanceData[] = [
  { day: 'Mon', attendance: clamp(DAILY_PRESENT_AVG * 1.00) },
  { day: 'Tue', attendance: clamp(DAILY_PRESENT_AVG * 0.92) },
  { day: 'Wed', attendance: clamp(DAILY_PRESENT_AVG * 1.00) },
  { day: 'Thu', attendance: clamp(DAILY_PRESENT_AVG * 0.93) },
  { day: 'Fri', attendance: clamp(DAILY_PRESENT_AVG * 1.01) },
  { day: 'Sat', attendance: clamp(DAILY_PRESENT_AVG * 0.72) },
  { day: 'Sun', attendance: clamp(DAILY_PRESENT_AVG * 0.35) },
  // Second week — similar distribution, small jitter for variety.
  { day: 'Mon', attendance: clamp(DAILY_PRESENT_AVG * 1.02) },
  { day: 'Tue', attendance: clamp(DAILY_PRESENT_AVG * 0.95) },
  { day: 'Wed', attendance: clamp(DAILY_PRESENT_AVG * 1.03) },
  { day: 'Thu', attendance: clamp(DAILY_PRESENT_AVG * 0.97) },
  { day: 'Fri', attendance: clamp(DAILY_PRESENT_AVG * 1.01) },
  { day: 'Sat', attendance: clamp(DAILY_PRESENT_AVG * 0.78) },
  { day: 'Sun', attendance: clamp(DAILY_PRESENT_AVG * 0.40) },
]

/**
 * Enrollment trend — modest year-over-year growth centered on the current
 * total, so the chart's most recent point matches the headline KPI.
 */
export const enrollmentTrendsData: EnrollmentData[] = (() => {
  const currentYear = new Date().getFullYear()
  const growthFactors = [0.78, 0.82, 0.88, 0.95, 1.00, 1.05, 1.09, 1.14]
  return growthFactors.map((factor, i) => ({
    year: currentYear - (growthFactors.length - 1 - i),
    enrollment: Math.round(TOTAL_ENROLLMENT * factor),
  }))
})()
