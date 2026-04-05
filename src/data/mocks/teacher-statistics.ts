/**
 * Mock teacher statistics data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */

export interface TeacherStatistics {
  total: number
  fullTime: number
  partTime: number
  substitute: number
}

export interface DepartmentData {
  name: string
  count: number
  percentage: number
}

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
  { name: 'Science', count: 19, percentage: 22 },
  { name: 'Mathematics', count: 17, percentage: 20 },
  { name: 'English', count: 14, percentage: 16 },
  { name: 'Social Studies', count: 13, percentage: 15 },
  { name: 'Art', count: 11, percentage: 13 },
  { name: 'Physical Education', count: 12, percentage: 12 },
]
