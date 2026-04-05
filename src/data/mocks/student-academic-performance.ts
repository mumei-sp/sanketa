/**
 * Mock data for Academic Performance by Grade chart on Students page.
 *
 * Each entry has a `month` key plus `grade{N}` keys for each grade tracked.
 * The chart reads grade keys dynamically — add/remove grades here and
 * the chart adapts automatically.
 */

export interface AcademicPerformanceEntry {
  month: string
  [gradeKey: `grade${string}`]: number | string
}

export const academicPerformanceLastSemester: AcademicPerformanceEntry[] = [
  { month: 'Jul', grade7: 85, grade8: 92, grade9: 83 },
  { month: 'Aug', grade7: 87, grade8: 94, grade9: 85 },
  { month: 'Sep', grade7: 82, grade8: 90, grade9: 78 },
  { month: 'Oct', grade7: 84, grade8: 88, grade9: 80 },
  { month: 'Nov', grade7: 86, grade8: 93, grade9: 85 },
  { month: 'Dec', grade7: 88, grade8: 96, grade9: 90 },
]

export const academicPerformanceThisSemester: AcademicPerformanceEntry[] = [
  { month: 'Jan', grade7: 83, grade8: 89, grade9: 85 },
  { month: 'Feb', grade7: 86, grade8: 91, grade9: 88 },
  { month: 'Mar', grade7: 84, grade8: 93, grade9: 86 },
  { month: 'Apr', grade7: 88, grade8: 90, grade9: 89 },
  { month: 'May', grade7: 87, grade8: 94, grade9: 91 },
  { month: 'Jun', grade7: 90, grade8: 95, grade9: 93 },
]
