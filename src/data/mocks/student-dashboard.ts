import type { AttendanceData, EnrollmentData } from '../dashboard'

/**
 * Mock attendance overview data for development and testing
 * TODO: Replace with real API calls when backend is ready
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
 * Mock enrollment trends data for development and testing
 * TODO: Replace with real API calls when backend is ready
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

