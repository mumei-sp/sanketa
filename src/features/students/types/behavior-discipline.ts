/**
 * Behavior and discipline record types for student details
 */

export type BehaviorRecordType = 'Positive Note' | 'Minor Issue' | 'Major Issue'

export type BehaviorStatus =
  | 'Record Recognition'
  | 'Recognition Recorded'
  | 'Issue Warning'
  | 'Parent Notified'
  | 'Pending Review'

export interface BehaviorDisciplineRecord {
  id: string
  studentId: string
  date: string // ISO date or formatted (e.g. "Jan 10, 2025")
  type: BehaviorRecordType
  details: string
  reportedBy: string
  status: BehaviorStatus
}
