import type { AttendanceOverviewData } from '@/features/attendance/types'

/**
 * Mock attendance overview data for 6 months (Jan-Jun)
 * Based on the design requirements with realistic attendance trends
 * Shows monthly attendance percentages for Students, Teachers, and Staff
 */
export const attendanceOverviewMonthlyData: AttendanceOverviewData[] = [
  {
    month: 'Jan',
    students: 50,
    teachers: 60,
    staff: 65,
  },
  {
    month: 'Feb',
    students: 78,
    teachers: 80,
    staff: 62,
  },
  {
    month: 'Mar',
    students: 75,
    teachers: 60,
    staff: 58,
  },
  {
    month: 'Apr',
    students: 60,
    teachers: 65,
    staff: 55,
  },
  {
    month: 'May',
    students: 72,
    teachers: 85,
    staff: 58,
  },
  {
    month: 'Jun',
    students: 78,
    teachers: 90,
    staff: 60,
  },
]
