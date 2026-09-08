/**
 * Grades API Service
 *
 * Mock path + HTTP path per endpoint.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { emitDomainEvent } from './notification-service'
import { withLatency, newId } from '@/mocks/_shared'
import { visibleRecordToCaller, visibleToCaller } from '@/mocks/_shared/caller'
import { classRosters } from '@/mocks/attendance/daily'
import { gradeSubmissions, findSubmission, upsertSubmission } from '@/mocks/grades/grades'
import { EXAMS, GRADEABLE_SUBJECT_IDS } from '@/features/grades/constants'
import { subjects } from '@/mocks/timetable/timetable'
import type { Exam, GradeEntry, GradeSubmission, GradeSheetRow, GradeSheetSummary } from '@/features/grades/types'

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** @apiRoute GET /api/v1/exams */
export async function fetchExams(): Promise<Exam[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return [...EXAMS]
    },
    async () => {
      const { data } = await apiClient.get<Exam[]>('/exams')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/classes (grades feature uses same endpoint) */
export async function fetchAvailableClasses(): Promise<string[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 200 })
      return Object.keys(classRosters)
    },
    async () => {
      const { data } = await apiClient.get<string[]>('/classes')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/subjects?gradeable=true */
export async function fetchGradeableSubjects(): Promise<
  { id: string; name: string; shortName: string }[]
> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 200 })
      return subjects
        .filter(s => (GRADEABLE_SUBJECT_IDS as readonly string[]).includes(s.id))
        .map(s => ({ id: s.id, name: s.name, shortName: s.shortName }))
    },
    async () => {
      const { data } = await apiClient.get<{ id: string; name: string; shortName: string }[]>(
        '/subjects',
        { params: { gradeable: true } },
      )
      return data
    },
  )
}

/** Blank grade entries for a class roster (used to seed the grade-entry form). */
export async function fetchClassRosterEntries(classId: string, maxMarks: number): Promise<GradeEntry[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      const roster = classRosters[classId]
      if (!roster) return []
      const entries = roster.map(s => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        marksObtained: null,
        maxMarks,
        remarks: '',
      }))
      // `studentId` here is `Student.id` — the same key a family's scope holds
      // — so a parent asking for a class register receives only their own
      // child's line.
      return visibleToCaller(entries, 'read', 'Grade', entry => ({
        studentId: entry.studentId,
        classSection: classId,
      }))
    },
    async () => {
      const { data } = await apiClient.get<GradeEntry[]>(
        `/classes/${classId}/roster/grade-entries`,
        { params: { maxMarks } },
      )
      return data
    },
  )
}

/**
 * Fetch an existing grade submission (or null).
 *
 * @apiRoute GET /api/v1/grades/submissions?classId={classId}&examId={examId}&subjectId={subjectId}
 */
export async function fetchGradeSubmission(
  classId: string,
  examId: string,
  subjectId: string,
): Promise<GradeSubmission | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      const sub = findSubmission(classId, examId, subjectId)
      if (!sub) return null
      // Class-shaped: the submission itself is not about one student, its
      // entries are. So the envelope survives and the lines inside it narrow —
      // a family gets their own child's mark, not a class's worth of them.
      const entries = visibleToCaller(
        sub.entries.map(e => ({ ...e })),
        'read',
        'Grade',
        entry => ({ studentId: entry.studentId, classSection: classId }),
      )
      return { ...sub, entries }
    },
    async () => {
      try {
        const { data } = await apiClient.get<GradeSubmission>('/grades/submissions', {
          params: { classId, examId, subjectId },
        })
        return data
      } catch (err: any) {
        if (err?.status === 404) return null
        throw err
      }
    },
  )
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/grades/submissions (status=draft) */
export async function saveGradeDraft(
  classId: string,
  examId: string,
  subjectId: string,
  entries: GradeEntry[],
): Promise<GradeSubmission> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 300, max: 600 })
      const existing = findSubmission(classId, examId, subjectId)
      const exam = EXAMS.find(e => e.id === examId)
      const submission: GradeSubmission = {
        id: existing?.id ?? newId(`sub-${classId}-${examId}-${subjectId}`),
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
    },
    async () => {
      const { data } = await apiClient.post<GradeSubmission>('/grades/submissions', {
        classId,
        examId,
        subjectId,
        entries,
        status: 'draft',
      })
      return data
    },
  )
}

/** @apiRoute POST /api/v1/grades/submissions (status=submitted) */
export async function submitGrades(
  classId: string,
  examId: string,
  subjectId: string,
  entries: GradeEntry[],
): Promise<GradeSubmission> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 400, max: 700 })
      const existing = findSubmission(classId, examId, subjectId)
      const exam = EXAMS.find(e => e.id === examId)
      const submission: GradeSubmission = {
        id: existing?.id ?? newId(`sub-${classId}-${examId}-${subjectId}`),
        classId,
        examId,
        subjectId,
        entries: entries.map(e => ({ ...e, maxMarks: exam?.maxMarks ?? e.maxMarks })),
        status: 'submitted',
        submittedBy: 'Admin',
        submittedAt: new Date().toISOString(),
      }
      upsertSubmission(submission)
      emitDomainEvent({
        type: 'grades.submitted',
        payload: {
          submissionId: submission.id,
          className: classId,
          examId,
          examName: exam?.name ?? examId,
          subjectId,
          subject: subjectId,
          entryCount: submission.entries.length,
        },
      })
      return { ...submission, entries: submission.entries.map(e => ({ ...e })) }
    },
    async () => {
      const { data } = await apiClient.post<GradeSubmission>('/grades/submissions', {
        classId,
        examId,
        subjectId,
        entries,
        status: 'submitted',
      })
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Grade sheet aggregation
// ---------------------------------------------------------------------------

/**
 * Fetch grade sheet data for a class + exam (all subjects aggregated).
 *
 * @apiRoute GET /api/v1/grades/sheet?classId={classId}&examId={examId}
 */
export async function fetchGradeSheet(
  classId: string,
  examId: string,
  calculateGrade: (marks: number, maxMarks: number) => { label: string; points: number; percentage: number },
  passingThreshold: number,
): Promise<{ rows: GradeSheetRow[]; summary: GradeSheetSummary }> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 300, max: 600 })

      const roster = classRosters[classId]
      if (!roster) {
        return {
          rows: [],
          summary: {
            subjectAverages: {},
            classAverage: 0,
            passCount: 0,
            failCount: 0,
            totalStudents: 0,
          },
        }
      }

      const subs = gradeSubmissions.filter(s => s.classId === classId && s.examId === examId)
      const gradeableIds = GRADEABLE_SUBJECT_IDS as readonly string[]

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

        const totalMaxMarks =
          subs.reduce((acc, s) => acc + (s.entries[0]?.maxMarks ?? 0), 0) || 1
        const pct = subjectCount > 0 ? (total / totalMaxMarks) * 100 : 0
        const overall =
          subjectCount > 0
            ? calculateGrade(total, totalMaxMarks)
            : { label: '—', points: 0, percentage: 0 }
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

      const subjectAverages: Record<string, number> = {}
      gradeableIds.forEach(subId => {
        const marks = rows.map(r => r.subjects[subId]?.marks).filter((m): m is number => m !== null)
        subjectAverages[subId] =
          marks.length > 0
            ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10
            : 0
      })

      const classAverage =
        rows.length > 0
          ? Math.round((rows.reduce((a, r) => a + r.percentage, 0) / rows.length) * 10) / 10
          : 0
      const passCount = rows.filter(r => r.percentage >= passingThreshold).length
      const failCount = rows.filter(r => r.percentage > 0 && r.percentage < passingThreshold).length

      return {
        // Narrowed, while the summary below is not: a class average is the
        // class's fact, not any student's, and blanking it would make a
        // family's report card unreadable rather than private. What must not
        // leak is the per-student rows, and those do narrow.
        rows: visibleToCaller(rows, 'read', 'Grade', row => ({
          studentId: row.studentId,
          classSection: classId,
        })),
        summary: {
          subjectAverages,
          classAverage,
          passCount,
          failCount,
          totalStudents: roster.length,
        },
      }
    },
    async () => {
      const { data } = await apiClient.get<{ rows: GradeSheetRow[]; summary: GradeSheetSummary }>(
        '/grades/sheet',
        { params: { classId, examId, passingThreshold } },
      )
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Report Card
// ---------------------------------------------------------------------------

/** Attendance summary for a student (mock approximation). */
export interface StudentAttendanceSummary {
  totalDays: number
  present: number
  late: number
  absent: number
}

/** Report card data for a single student. */
export interface ReportCardData {
  gradeRow: GradeSheetRow
  subjects: { id: string; name: string; shortName: string }[]
  exam: Exam
  maxMarks: number
  attendance: StudentAttendanceSummary
}

/**
 * Fetch all data needed for a student's report card.
 *
 * @apiRoute GET /api/v1/students/{studentId}/report-card?classId={classId}&examId={examId}
 */
export async function fetchStudentReportCard(
  studentId: string,
  classId: string,
  examId: string,
  calculateGrade: (marks: number, maxMarks: number) => { label: string; points: number; percentage: number },
  passingThreshold: number,
): Promise<ReportCardData | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 300, max: 600 })
      const { rows } = await fetchGradeSheet(classId, examId, calculateGrade, passingThreshold)
      const gradeRow = rows.find(r => r.studentId === studentId)
      if (!gradeRow) return null
      // A report card is one student's, named by id in the arguments — the
      // by-id shape that filtering the sheet does nothing for.
      if (!visibleRecordToCaller(gradeRow, 'read', 'Grade', row => ({
        studentId: row.studentId,
        classSection: classId,
      }))) {
        return null
      }

      const subjectList = subjects
        .filter(s => (GRADEABLE_SUBJECT_IDS as readonly string[]).includes(s.id))
        .map(s => ({ id: s.id, name: s.name, shortName: s.shortName }))

      const exam = EXAMS.find(e => e.id === examId)
      if (!exam) return null

      // Approximate attendance — ~180 working days in an Indian school year.
      const attendance: StudentAttendanceSummary = {
        totalDays: 180,
        present: 164 + Math.floor(Math.random() * 10),
        late: 3 + Math.floor(Math.random() * 5),
        absent: 3 + Math.floor(Math.random() * 5),
      }

      return { gradeRow, subjects: subjectList, exam, maxMarks: exam.maxMarks, attendance }
    },
    async () => {
      try {
        const { data } = await apiClient.get<ReportCardData>(
          `/students/${studentId}/report-card`,
          { params: { classId, examId, passingThreshold } },
        )
        return data
      } catch (err: any) {
        if (err?.status === 404) return null
        throw err
      }
    },
  )
}
