/**
 * Mock teacher statistics data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */

import type { DepartmentData, TeacherStatistics } from '@/features/teachers/types'


/**
 * Mock teacher statistics
 * This represents aggregated statistics about teachers
 */
export const teacherStatisticsData: TeacherStatistics = {
  total: 86,
  fullTime: 62,
  partTime: 18,
  substitute: 6,
}

/**
 * Mock department distribution data
 * Shows teacher counts by department/subject area
 */
export const departmentDistributionData: DepartmentData[] = [
  { name: 'Science', count: 14, percentage: 16 },
  { name: 'Mathematics', count: 13, percentage: 15 },
  { name: 'English', count: 12, percentage: 14 },
  { name: 'Social Studies', count: 10, percentage: 12 },
  { name: 'Hindi', count: 9, percentage: 10 },
  { name: 'Computer Science', count: 8, percentage: 9 },
  { name: 'Physical Education', count: 7, percentage: 8 },
  { name: 'Art', count: 5, percentage: 6 },
  { name: 'Music', count: 4, percentage: 5 },
  { name: 'Library', count: 4, percentage: 5 },
]
