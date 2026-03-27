/**
 * Grade feature type definitions.
 *
 * Covers exam definitions, grade entries, submissions, and grade sheet rows.
 * Raw marks are stored; grade labels are computed at render time via useGradeCalculator.
 */

// ============================================================================
// Exam
// ============================================================================

/** An exam/assessment that students are graded on */
export interface Exam {
  /** Unique identifier (e.g., 'ut1', 'half', 'ann') */
  id: string
  /** Display name (e.g., "Unit Test 1", "Half Yearly") */
  name: string
  /** Term this exam belongs to (e.g., 'term-1') */
  termId: string
  /** Term display name (e.g., "Term 1") */
  termName: string
  /** Maximum marks for the exam */
  maxMarks: number
  /** Exam date in ISO format */
  date: string
}

// ============================================================================
// Grade Entry (one student, one subject, one exam)
// ============================================================================

/** A single student's grade entry for mark entry */
export interface GradeEntry {
  /** Student ID (matches attendance roster) */
  studentId: string
  /** Student full name */
  studentName: string
  /** Roll number */
  rollNumber: string
  /** Marks obtained (null = not yet entered) */
  marksObtained: number | null
  /** Maximum marks for the exam */
  maxMarks: number
  /** Optional teacher remarks */
  remarks: string
}

// ============================================================================
// Grade Submission (per class + exam + subject)
// ============================================================================

/** Submission status lifecycle */
export type GradeSubmissionStatus = 'draft' | 'submitted' | 'published'

/** A batch of grade entries for one class + exam + subject */
export interface GradeSubmission {
  /** Unique submission ID */
  id: string
  /** Class identifier (e.g., '9A') */
  classId: string
  /** Exam ID */
  examId: string
  /** Subject ID */
  subjectId: string
  /** Per-student grade entries */
  entries: GradeEntry[]
  /** Submission status */
  status: GradeSubmissionStatus
  /** Who submitted */
  submittedBy: string
  /** When submitted (ISO timestamp) */
  submittedAt: string
  /** Last editor name */
  lastEditedBy?: string
  /** Last edit timestamp */
  lastEditedAt?: string
}

// ============================================================================
// Grade Sheet (read-only aggregate view)
// ============================================================================

/** A single subject's marks + grade for one student */
export interface SubjectGrade {
  marks: number | null
  grade: string
}

/** One row in the grade sheet (one student, all subjects) */
export interface GradeSheetRow {
  studentId: string
  studentName: string
  rollNumber: string
  /** Subject ID → marks + grade */
  subjects: Record<string, SubjectGrade>
  /** Total marks across all subjects */
  total: number
  /** Overall percentage */
  percentage: number
  /** Overall grade label */
  overallGrade: string
  /** Grade point average */
  gpa: number
}

/** Summary statistics for the grade sheet */
export interface GradeSheetSummary {
  /** Subject ID → class average marks */
  subjectAverages: Record<string, number>
  /** Overall class average percentage */
  classAverage: number
  /** Number of passing students */
  passCount: number
  /** Number of failing students */
  failCount: number
  /** Total students */
  totalStudents: number
}
