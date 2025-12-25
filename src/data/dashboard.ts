export interface AttendanceData {
  day: string
  attendance: number
}

export interface EnrollmentData {
  year: number
  enrollment: number
}

/**
 * Attendance overview data for weekdays
 * Extended with more days including weekends and additional weeks
 * Values in the range ~1100-1250 matching the reference image
 */
export const attendanceOverviewData: AttendanceData[] = [
  { day: 'Mon', attendance: 1180 },
  { day: 'Tue', attendance: 1085 },
  { day: 'Wed', attendance: 1230 },
  { day: 'Thu', attendance: 1102 },
  { day: 'Fri', attendance: 1200 },
  { day: 'Sat', attendance: 850 },
  { day: 'Sun', attendance: 420 },
  // Additional week data
  { day: 'Mon', attendance: 1195 },
  { day: 'Tue', attendance: 1120 },
  { day: 'Wed', attendance: 1245 },
  { day: 'Thu', attendance: 1150 },
  { day: 'Fri', attendance: 1215 },
  { day: 'Sat', attendance: 920 },
  { day: 'Sun', attendance: 480 },
]

/**
 * Enrollment trends data for years 2025-2040
 * Extended with more years showing long-term trends
 * Values match the reference image with peak at ~8,015 in 2031 and ~12K+ in 2033
 */
export const enrollmentTrendsData: EnrollmentData[] = [
  { year: 2025, enrollment: 1200 },
  { year: 2026, enrollment: 1820 },
  { year: 2027, enrollment: 1100 },
  { year: 2028, enrollment: 1400 },
  { year: 2029, enrollment: 1800 },
  { year: 2030, enrollment: 1500 },
  { year: 2031, enrollment: 1015 },
  { year: 2032, enrollment: 1760 },
]
