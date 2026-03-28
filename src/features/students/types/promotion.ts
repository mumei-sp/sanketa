/**
 * Student promotion types for year-end class promotion workflow.
 */

/** Decision for each student during promotion */
export type PromotionDecision = 'promote' | 'retain' | 'transfer'

/** A student being considered for promotion */
export interface PromotionCandidate {
  studentId: string
  studentName: string
  rollNumber: string
  class: string
  gradeLevel: string
  section: string
  percentage: number
  gpa: number
  performance: string
  status: string
  avatarUrl?: string
  /** System recommendation based on passing threshold */
  recommendation: PromotionDecision
  /** Admin's final decision (defaults to recommendation, overridable) */
  decision: PromotionDecision
}

/** Summary of a class available for promotion */
export interface ClassPromotionSummary {
  classLabel: string
  studentCount: number
  avgPercentage: number
}
