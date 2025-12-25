/**
 * Student performance levels
 */
export type StudentPerformance = 'Good' | 'Needs Support' | 'At Risk'

/**
 * Student status options
 */
export type StudentStatus = 'Active' | 'On Leave'

/**
 * Student record for table display
 */
export interface Student {
  id: string
  name: string
  studentId: string
  class: string
  gpa: number
  performance: StudentPerformance
  percentage: number
  status: StudentStatus
  avatarUrl?: string
}

