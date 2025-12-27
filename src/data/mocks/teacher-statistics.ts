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
