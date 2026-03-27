/**
 * Grade service — mock CRUD operations for grade management.
 *
 * All functions simulate network delay and operate on in-memory mock data.
 * Replace with real API calls when backend is ready.
 */

import { classRosters } from '@/data/mocks/attendance-daily'
import { gradeSubmissions, findSubmission, upsertSubmission } from '@/data/mocks/grades'
import { EXAMS, GRADEABLE_SUBJECT_IDS } from '@/features/grades/constants'
import { subjects } from '@/data/mocks/timetable'
import type { Exam, GradeEntry, GradeSubmission, GradeSheetRow, GradeSheetSummary, SubjectGrade } from '@/features/grades/types'

// ============================================================================
// Helpers
// ============================================================================

function delay(min = 300, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// API Functions
// ============================================================================

/** Fetch all exam definitions */
export async function fetchExams(): Promise<Exam[]> {
  await delay(100, 300)
  return [...EXAMS]
}

/** Fetch available class IDs that have rosters */
export async function fetchAvailableClasses(): Promise<string[]> {
  await delay(100, 200)
  return Object.keys(classRosters)
}

/** Fetch gradeable subjects (with names) */
export async function fetchGradeableSubjects(): Promise<{ id: string; name: string; shortName: string }[]> {
  await delay(100, 200)
  return subjects
    .filter(s => (GRADEABLE_SUBJECT_IDS as readonly string[]).includes(s.id))
    .map(s => ({ id: s.id, name: s.name, shortName: s.shortName }))
}

/** Fetch blank grade entries for a class roster */
export async function fetchClassRosterEntries(classId: string, maxMarks: number): Promise<GradeEntry[]> {
  await delay(200, 400)
  const roster = classRosters[classId]
  if (!roster) return []
  return roster.map(s => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    marksObtained: null,
    maxMarks,
    remarks: '',
  }))
}

/** Fetch an existing grade submission (or null if none exists) */
export async function fetchGradeSubmission(
  classId: string,
  examId: string,
  subjectId: string,
): Promise<GradeSubmission | null> {
  await delay(300, 600)
  const sub = findSubmission(classId, examId, subjectId)
  if (!sub) return null
  return {
    ...sub,
    entries: sub.entries.map(e => ({ ...e })),
  }
}

/** Save grades as draft */
export async function saveGradeDraft(
  classId: string,
  examId: string,
  subjectId: string,
  entries: GradeEntry[],
): Promise<GradeSubmission> {
  await delay(300, 600)
  const existing = findSubmission(classId, examId, subjectId)
  const exam = EXAMS.find(e => e.id === examId)
  const submission: GradeSubmission = {
    id: existing?.id ?? `sub-${classId}-${examId}-${subjectId}-${Date.now()}`,
    classId,
    examId,
    subjectId,
    entries: entries.map(e => ({ ...e, maxMarks: exam?.maxMarks ?? e.maxMarks })),
    status: 'draft',
    submittedBy: existing?.submittedBy ?? 'Admin',
    submittedAt: existing?.submittedAt ?? new Date().toISOString(),
    lastEditedBy: 'Admin',
    lastEditedAt: new Date().toISOString(),
  }
  upsertSubmission(submission)
  return { ...submission, entries: submission.entries.map(e => ({ ...e })) }
}

/** Submit grades (marks final) */
export async function submitGrades(
  classId: string,
  examId: string,
  subjectId: string,
  entries: GradeEntry[],
): Promise<GradeSubmission> {
  await delay(400, 700)
  const existing = findSubmission(classId, examId, subjectId)
  const exam = EXAMS.find(e => e.id === examId)
  const submission: GradeSubmission = {
    id: existing?.id ?? `sub-${classId}-${examId}-${subjectId}-${Date.now()}`,
    classId,
    examId,
    subjectId,
    entries: entries.map(e => ({ ...e, maxMarks: exam?.maxMarks ?? e.maxMarks })),
    status: 'submitted',
    submittedBy: 'Admin',
    submittedAt: new Date().toISOString(),
  }
  upsertSubmission(submission)
  return { ...submission, entries: submission.entries.map(e => ({ ...e })) }
}

/** Fetch grade sheet data for a class + exam (all subjects aggregated) */
export async function fetchGradeSheet(
  classId: string,
  examId: string,
  calculateGrade: (marks: number, maxMarks: number) => { label: string; points: number; percentage: number },
  passingThreshold: number,
): Promise<{ rows: GradeSheetRow[]; summary: GradeSheetSummary }> {
  await delay(300, 600)

  const roster = classRosters[classId]
  if (!roster) return { rows: [], summary: { subjectAverages: {}, classAverage: 0, passCount: 0, failCount: 0, totalStudents: 0 } }

  // Gather all submissions for this class + exam
  const subs = gradeSubmissions.filter(
    s => s.classId === classId && s.examId === examId,
  )

  const gradeableIds = GRADEABLE_SUBJECT_IDS as readonly string[]

  // Build rows
  const rows: GradeSheetRow[] = roster.map(student => {
    const subjectGrades: Record<string, { marks: number | null; grade: string }> = {}
    let total = 0
    let subjectCount = 0
    const points: number[] = []

    gradeableIds.forEach(subId => {
      const sub = subs.find(s => s.subjectId === subId)
      const entry = sub?.entries.find(e => e.studentId === student.id)
      const marks = entry?.marksObtained ?? null
      const maxMarks = sub?.entries[0]?.maxMarks ?? 100

      if (marks !== null) {
        const g = calculateGrade(marks, maxMarks)
        subjectGrades[subId] = { marks, grade: g.label }
        total += marks
        subjectCount++
        points.push(g.points)
      } else {
        subjectGrades[subId] = { marks: null, grade: '—' }
      }
    })

    const totalMaxMarks = subs.reduce((acc, s) => acc + (s.entries[0]?.maxMarks ?? 0), 0) || 1
    const pct = subjectCount > 0 ? (total / totalMaxMarks) * 100 : 0
    const overall = subjectCount > 0 ? calculateGrade(total, totalMaxMarks) : { label: '—', points: 0, percentage: 0 }
    const gpa = points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0

    return {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      subjects: subjectGrades,
      total,
      percentage: Math.round(pct * 10) / 10,
      overallGrade: overall.label,
      gpa: Math.round(gpa * 10) / 10,
    }
  })

  // Build summary
  const subjectAverages: Record<string, number> = {}
  gradeableIds.forEach(subId => {
    const marks = rows.map(r => r.subjects[subId]?.marks).filter((m): m is number => m !== null)
    subjectAverages[subId] = marks.length > 0 ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : 0
  })

  const classAverage = rows.length > 0
    ? Math.round((rows.reduce((a, r) => a + r.percentage, 0) / rows.length) * 10) / 10
    : 0
  const passCount = rows.filter(r => r.percentage >= passingThreshold).length
  const failCount = rows.filter(r => r.percentage > 0 && r.percentage < passingThreshold).length

  return {
    rows,
    summary: {
      subjectAverages,
      classAverage,
      passCount,
      failCount,
      totalStudents: roster.length,
    },
  }
}

// ============================================================================
// Report Card
// ============================================================================

/** Attendance summary for a student (mock) */
export interface StudentAttendanceSummary {
  totalDays: number
  present: number
  late: number
  absent: number
}

/** Report card data for a single student */
export interface ReportCardData {
  gradeRow: GradeSheetRow
  subjects: { id: string; name: string; shortName: string }[]
  exam: Exam
  maxMarks: number
  attendance: StudentAttendanceSummary
}

/** Fetch all data needed for a student's report card */
export async function fetchStudentReportCard(
  studentId: string,
  classId: string,
  examId: string,
  calculateGrade: (marks: number, maxMarks: number) => { label: string; points: number; percentage: number },
  passingThreshold: number,
): Promise<ReportCardData | null> {
  await delay(300, 600)

  // Get the grade sheet for the class + exam
  const { rows } = await fetchGradeSheet(classId, examId, calculateGrade, passingThreshold)
  const gradeRow = rows.find(r => r.studentId === studentId)
  if (!gradeRow) return null

  // Get subjects
  const subjectList = subjects
    .filter(s => (GRADEABLE_SUBJECT_IDS as readonly string[]).includes(s.id))
    .map(s => ({ id: s.id, name: s.name, shortName: s.shortName }))

  // Get exam metadata
  const exam = EXAMS.find(e => e.id === examId)
  if (!exam) return null

  // Mock attendance (realistic for an Indian school year — ~180 working days)
  const attendance: StudentAttendanceSummary = {
    totalDays: 180,
    present: 164 + Math.floor(Math.random() * 10),
    late: 3 + Math.floor(Math.random() * 5),
    absent: 3 + Math.floor(Math.random() * 5),
  }

  return {
    gradeRow,
    subjects: subjectList,
    exam,
    maxMarks: exam.maxMarks,
    attendance,
  }
}
