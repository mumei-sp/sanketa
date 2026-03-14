/**
 * Mock behavior and discipline records for students
 * Keyed by studentId for lookup on student details page
 */

import type { BehaviorDisciplineRecord } from '@/features/students/types/behavior-discipline'

export const behaviorDisciplineByStudent: Record<string, BehaviorDisciplineRecord[]> = {
  'S-2106': [
    {
      id: 'bd-1',
      studentId: 'S-2106',
      date: 'Jan 10, 2025',
      type: 'Positive Note',
      details: 'Helped classmates during group project',
      reportedBy: 'Ms. Lee Record',
      status: 'Record Recognition',
    },
    {
      id: 'bd-2',
      studentId: 'S-2106',
      date: 'Feb 02, 2025',
      type: 'Positive Note',
      details: 'Volunteered in school event organization',
      reportedBy: 'Admin Office',
      status: 'Recognition Recorded',
    },
    {
      id: 'bd-3',
      studentId: 'S-2106',
      date: 'Feb 18, 2025',
      type: 'Minor Issue',
      details: 'Late submission of homework',
      reportedBy: 'Mr. Maulie',
      status: 'Issue Warning',
    },
    {
      id: 'bd-4',
      studentId: 'S-2106',
      date: 'Mar 05, 2025',
      type: 'Minor Issue',
      details: 'Absent without prior notice',
      reportedBy: 'Homeroom Teacher',
      status: 'Parent Notified',
    },
  ],
  'S-2101': [
    {
      id: 'bd-5',
      studentId: 'S-2101',
      date: 'Jan 12, 2025',
      type: 'Positive Note',
      details: 'Excellent presentation in science fair',
      reportedBy: 'Ms. Johnson',
      status: 'Recognition Recorded',
    },
    {
      id: 'bd-5b',
      studentId: 'S-2101',
      date: 'Feb 15, 2025',
      type: 'Positive Note',
      details: 'Led group project effectively',
      reportedBy: 'Mr. Smith',
      status: 'Record Recognition',
    },
    {
      id: 'bd-5c',
      studentId: 'S-2101',
      date: 'Mar 01, 2025',
      type: 'Minor Issue',
      details: 'Late to class once',
      reportedBy: 'Homeroom Teacher',
      status: 'Parent Notified',
    },
  ],
  'S-2102': [
    {
      id: 'bd-6',
      studentId: 'S-2102',
      date: 'Mar 01, 2025',
      type: 'Minor Issue',
      details: 'Disrupted class during lesson',
      reportedBy: 'Mr. Smith',
      status: 'Parent Notified',
    },
  ],
}

/** Default placeholder records when student has fewer than 3 */
const DEFAULT_RECORDS: Omit<BehaviorDisciplineRecord, 'id' | 'studentId'>[] = [
  { date: '—', type: 'Positive Note', details: 'No records yet', reportedBy: '—', status: 'Pending Review' },
  { date: '—', type: 'Minor Issue', details: 'No records yet', reportedBy: '—', status: 'Pending Review' },
  { date: '—', type: 'Positive Note', details: 'No records yet', reportedBy: '—', status: 'Pending Review' },
]

/** Get behavior records for a student; ensures at least 3 entries (pads with defaults if fewer) */
export function getBehaviorRecordsForStudent(studentId: string): BehaviorDisciplineRecord[] {
  const sid = studentId || 'unknown'
  const records = behaviorDisciplineByStudent[sid] ?? []
  if (records.length >= 3) return records
  const padded: BehaviorDisciplineRecord[] = [...records]
  while (padded.length < 3) {
    const def = DEFAULT_RECORDS[padded.length % DEFAULT_RECORDS.length]
    padded.push({
      id: `default-${sid}-${padded.length}`,
      studentId: sid,
      ...def,
    })
  }
  return padded
}
