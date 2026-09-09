/**
 * Mock grade data for the grades feature.
 *
 * Pre-populates Class 9A with submitted Unit Test 1 grades (all subjects)
 * and a draft Half Yearly Math submission. Other classes have no data yet.
 *
 * Uses student rosters from attendance-daily.ts for consistency.
 */

import { classRosters } from '@/mocks/attendance/daily'
import { GRADEABLE_SUBJECT_IDS, EXAMS } from '@/features/grades/constants'
import { relativeDate } from '@/mocks/_shared/date-helpers'
import type { GradeSubmission, GradeEntry } from '@/features/grades/types'

// ============================================================================
// Helpers
// ============================================================================

/** Generate realistic marks for a student given max marks */
function randomMarks(maxMarks: number, floor = 20): number {
  const pct = floor + Math.random() * (100 - floor)
  return Math.round((pct / 100) * maxMarks)
}

/** Build a blank entry for a student */
/** @internal Build a blank entry for a student */
export function blankEntry(studentId: string, studentName: string, rollNumber: string, maxMarks: number): GradeEntry {
  return { studentId, studentName, rollNumber, marksObtained: null, maxMarks, remarks: '' }
}

// ============================================================================
// Pre-populated Submissions
// ============================================================================

const ut1Exam = EXAMS.find(e => e.id === 'ut1')!
const halfExam = EXAMS.find(e => e.id === 'half')!
const roster9A = classRosters['9A'] ?? []

/** Generate a submitted grade submission for 9A, UT1, one subject */
function make9AUT1Submission(subjectId: string): GradeSubmission {
  return {
    id: `sub-9a-ut1-${subjectId}`,
    classId: '9A',
    examId: 'ut1',
    subjectId,
    entries: roster9A.map(s => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      marksObtained: randomMarks(ut1Exam.maxMarks, 25),
      maxMarks: ut1Exam.maxMarks,
      remarks: '',
    })),
    // Published, not merely submitted. The status has existed since grades
    // were built and never meant anything; now it gates whether a family can
    // read the marks, so a school with nothing published would show every
    // parent an empty page and look broken rather than careful. Unit Test 1
    // was marked and released two months ago, which is the ordinary case.
    status: 'published',
    submittedBy: 'Priya Nair',
    // Unit Test 1 was submitted ~60 days ago.
    submittedAt: relativeDate(-60).toISOString(),
  }
}

// Seed all UT1 subjects for 9A
const seededSubmissions: GradeSubmission[] = GRADEABLE_SUBJECT_IDS.map(sid =>
  make9AUT1Submission(sid),
)

// Add a draft Half Yearly Math submission for 9A (partial — only first 8 students have marks)
seededSubmissions.push({
  id: 'sub-9a-half-math',
  classId: '9A',
  examId: 'half',
  subjectId: 'math',
  entries: roster9A.map((s, i) => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    marksObtained: i < 8 ? randomMarks(halfExam.maxMarks, 30) : null,
    maxMarks: halfExam.maxMarks,
    remarks: '',
  })),
  status: 'draft',
  submittedBy: 'Priya Nair',
  // Half Yearly draft saved ~30 days ago.
  submittedAt: relativeDate(-30).toISOString(),
})

// ============================================================================
// Mutable in-memory store (for mock CRUD)
// ============================================================================

export const gradeSubmissions: GradeSubmission[] = [...seededSubmissions]

/** Find a submission by class + exam + subject */
export function findSubmission(classId: string, examId: string, subjectId: string): GradeSubmission | undefined {
  return gradeSubmissions.find(
    s => s.classId === classId && s.examId === examId && s.subjectId === subjectId,
  )
}

/** Upsert a submission into the store */
export function upsertSubmission(submission: GradeSubmission): void {
  const idx = gradeSubmissions.findIndex(s => s.id === submission.id)
  if (idx >= 0) {
    gradeSubmissions[idx] = submission
  } else {
    gradeSubmissions.push(submission)
  }
}
