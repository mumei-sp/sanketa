/** Mock data for Academic Performance by Grade chart on Students page */

export interface AcademicPerformanceEntry {
  month: string
  grade7: number
  grade8: number
  grade9: number
}

export const academicPerformanceLastSemester: AcademicPerformanceEntry[] = [
  { month: 'Aug', grade7: 68, grade8: 72, grade9: 74 },
  { month: 'Sep', grade7: 71, grade8: 69, grade9: 76 },
  { month: 'Oct', grade7: 65, grade8: 74, grade9: 72 },
  { month: 'Nov', grade7: 73, grade8: 70, grade9: 78 },
  { month: 'Dec', grade7: 76, grade8: 75, grade9: 80 },
]

export const academicPerformanceThisSemester: AcademicPerformanceEntry[] = [
  { month: 'Jan', grade7: 70, grade8: 73, grade9: 77 },
  { month: 'Feb', grade7: 74, grade8: 71, grade9: 79 },
  { month: 'Mar', grade7: 72, grade8: 76, grade9: 81 },
  { month: 'Apr', grade7: 77, grade8: 74, grade9: 83 },
  { month: 'May', grade7: 79, grade8: 78, grade9: 85 },
]
