/**
 * Students API Service
 *
 * Each public function pairs a mock path (in-memory `studentsData`) with an
 * HTTP path (backend via apiClient). VITE_USE_MOCK_API picks which runs.
 */
import type { Student, StudentDetailData } from '@/features/students/types'
import type { PromotionCandidate, ClassPromotionSummary } from '@/features/students/types/promotion'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId, makeId, ID_BASE } from '@/mocks/_shared'
import {
  callerSeesEveryRow,
  visibleRecordToCaller,
  visibleToCaller,
} from '@/mocks/_shared/caller'
import { classSectionOf } from '@/utils/class-section-helpers'
import { studentsData } from '@/mocks/students/students'
import { enrollmentTrendsData, attendanceOverviewData } from '@/mocks/students/dashboard'
import { studentDetailData } from '@/mocks/students/details'
import { specialProgramsData } from '@/mocks/students/programs'
import {
  academicPerformanceLastSemester,
  academicPerformanceThisSemester,
} from '@/mocks/students/academic-performance'
import type { AcademicPerformanceEntry } from '@/mocks/students/academic-performance'

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Fetch all students.
 *
 * @apiRoute GET /api/v1/students
 */
export async function fetchStudents(options?: { limit?: number }): Promise<Student[]> {
  const limit = options?.limit
  return mockOrHttp(
    async () => {
      await withLatency()
      const rows = limit === undefined ? [...studentsData] : studentsData.slice(0, limit)
      return visibleToCaller(rows, 'read', 'Student', student => ({
        studentId: String(student.id),
        classSection: classSectionOf(student),
      }))
    },
    async () => {
      // Sent as a query rather than sliced after the fact: a caller that wants
      // two rows should not pull a whole school's roster over the wire.
      const { data } = await apiClient.get<Student[]>('/students', {
        params: limit === undefined ? undefined : { limit },
      })
      return data
    },
  )
}

/**
 * Fetch a single student by id.
 *
 * @apiRoute GET /api/v1/students/{id}
 */
export async function fetchStudentById(id: string): Promise<Student | undefined> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      const found = studentsData.find(s => s.id === id)
      // By-id reads take the id from the caller, so filtering the list read did
      // nothing for them: a parent could name any student and receive them.
      return visibleRecordToCaller(found, 'read', 'Student', student => ({
        studentId: String(student.id),
        classSection: classSectionOf(student),
      }))
    },
    async () => {
      try {
        const { data } = await apiClient.get<Student>(`/students/${id}`)
        return data
      } catch (err: any) {
        if (err?.status === 404) return undefined
        throw err
      }
    },
  )
}

/**
 * Fetch enrollment trend datapoints for the students dashboard.
 *
 * @apiRoute GET /api/v1/students/metrics/enrollment
 */
export async function fetchEnrollmentTrends(): Promise<EnrollmentData[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...enrollmentTrendsData]
    },
    async () => {
      const { data } = await apiClient.get<EnrollmentData[]>('/students/metrics/enrollment')
      return data
    },
  )
}

/**
 * Fetch weekly attendance overview for the students dashboard.
 *
 * @apiRoute GET /api/v1/students/metrics/attendance
 */
export async function fetchAttendanceOverview(): Promise<AttendanceData[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...attendanceOverviewData]
    },
    async () => {
      const { data } = await apiClient.get<AttendanceData[]>('/students/metrics/attendance')
      return data
    },
  )
}

/**
 * Fetch the detail payload for a single student (attendance, scholarships, …).
 *
 * @apiRoute GET /api/v1/students/{id}/details
 */
/**
 * What a caller who may not see this student gets instead.
 *
 * Empty rather than an error, for the same reason `visibleRecordToCaller`
 * returns undefined: a refusal that names the record confirms it exists.
 */
const EMPTY_STUDENT_DETAIL: StudentDetailData = {
  documents: [],
  scholarships: [],
  healthRecords: [],
  extracurriculars: [],
  behaviorLog: [],
  monthlyAttendance: {},
}

export async function fetchStudentDetailData(_id: string): Promise<StudentDetailData> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      // Gated on the student the detail is *about*, not on the record itself:
      // the mock ships one shared detail blob, so there is nothing in the
      // returned value to attribute. The id is the only thing that says whose
      // page this is, which makes it the thing to check.
      const subject = studentsData.find(student => String(student.id) === String(_id))
      // An id matching no student used to skip the check entirely — `subject &&`
      // short-circuited — so asking for a student who does not exist returned
      // the shared record to anyone. The bypass was easier than guessing a real
      // id. An unresolvable id is now only answered for a caller who may see
      // every student anyway.
      const allowed = subject
        ? visibleRecordToCaller(subject, 'read', 'Student', student => ({
            studentId: String(student.id),
            classSection: classSectionOf(student),
          })) !== undefined
        : callerSeesEveryRow('read', 'Student')
      if (!allowed) return EMPTY_STUDENT_DETAIL
      // The mock dataset currently ships a single shared detail record.
      return studentDetailData
    },
    async () => {
      const { data } = await apiClient.get<StudentDetailData>(`/students/${_id}/details`)
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new student.
 *
 * @apiRoute POST /api/v1/students
 */
export async function createStudent(data: Partial<Student>): Promise<Student> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const newStudent: Student = {
        ...data,
        id: newId('stu'),
        studentId: data.studentId || makeId('S', ID_BASE.student + studentsData.length),
        gpa: data.gpa ?? 0,
        performance: data.performance ?? 'Good',
        percentage: data.percentage ?? 0,
        status: data.status ?? 'Active',
      } as Student
      studentsData.unshift(newStudent)
      return newStudent
    },
    async () => {
      const { data: created } = await apiClient.post<Student>('/students', data)
      return created
    },
  )
}

/**
 * Update an existing student.
 *
 * @apiRoute PUT /api/v1/students/{id}
 */
export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const index = studentsData.findIndex(s => s.id === id)
      if (index === -1) throw new Error('Student not found')
      const updated = { ...studentsData[index], ...data }
      studentsData[index] = updated
      return updated
    },
    async () => {
      const { data: updated } = await apiClient.put<Student>(`/students/${id}`, data)
      return updated
    },
  )
}

// ---------------------------------------------------------------------------
// Promotion workflow
// ---------------------------------------------------------------------------

/**
 * Get available classes with student counts for promotion.
 *
 * @apiRoute GET /api/v1/students/promotion/classes
 */
export async function fetchClassesForPromotion(): Promise<ClassPromotionSummary[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 500 })
      const classMap = new Map<string, { count: number; totalPct: number }>()
      studentsData.forEach(s => {
        if (!s.class) return
        const existing = classMap.get(s.class) || { count: 0, totalPct: 0 }
        existing.count++
        existing.totalPct += s.percentage ?? 0
        classMap.set(s.class, existing)
      })
      const summaries: ClassPromotionSummary[] = []
      classMap.forEach((data, classLabel) => {
        summaries.push({
          classLabel,
          studentCount: data.count,
          avgPercentage: Math.round((data.totalPct / data.count) * 10) / 10,
        })
      })
      summaries.sort((a, b) =>
        a.classLabel.localeCompare(b.classLabel, undefined, { numeric: true }),
      )
      return summaries
    },
    async () => {
      const { data } = await apiClient.get<ClassPromotionSummary[]>('/students/promotion/classes')
      return data
    },
  )
}

/**
 * Get promotion candidates for a specific class.
 *
 * @apiRoute GET /api/v1/students/promotion/candidates?class={classLabel}&threshold={passingThreshold}
 */
export async function fetchPromotionCandidates(
  classLabel: string,
  passingThreshold: number,
): Promise<PromotionCandidate[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 300, max: 700 })
      const students = studentsData.filter(s => s.class === classLabel)
      // Promotion rows name a student and their marks, so they narrow like any
      // other per-student read.
      const visible = visibleToCaller(students, 'read', 'Student', student => ({
        studentId: String(student.id),
        classSection: classSectionOf(student),
      }))
      return visible.map(s => {
        const pct = s.percentage ?? 0
        const isAtRisk = s.performance === 'At Risk'
        const recommendation = pct >= passingThreshold && !isAtRisk ? 'promote' : 'retain'
        return {
          studentId: s.id,
          studentName:
            s.fullName ||
            s.displayName ||
            s.name ||
            [s.firstName, s.lastName].filter(Boolean).join(' ') ||
            'Unknown',
          rollNumber: s.rollNumber || s.studentId || '',
          class: s.class || classLabel,
          gradeLevel: s.gradeLevel || classLabel.replace(/[A-Z]/g, ''),
          section: s.section || classLabel.replace(/[0-9]/g, ''),
          percentage: pct,
          gpa: s.gpa ?? 0,
          performance: s.performance ?? 'Good',
          status: s.status ?? 'Active',
          avatarUrl: s.avatarUrl ?? s.profilePictureUrl,
          recommendation,
          decision: recommendation,
        } as PromotionCandidate
      })
    },
    async () => {
      const { data } = await apiClient.get<PromotionCandidate[]>(
        '/students/promotion/candidates',
        { params: { class: classLabel, threshold: passingThreshold } },
      )
      return data
    },
  )
}

/**
 * Execute promotion decisions — update student records.
 *
 * @apiRoute POST /api/v1/students/promotion/execute
 */
export async function executePromotion(
  sourceClass: string,
  candidates: PromotionCandidate[],
  targetSection: string,
): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 500, max: 1000 })
      const sourceGrade = parseInt(sourceClass.replace(/[A-Z]/g, ''))
      const targetGrade = sourceGrade + 1
      const targetClass = `${targetGrade}${targetSection}`
      candidates.forEach(c => {
        const student = studentsData.find(s => s.id === c.studentId)
        if (!student) return
        if (c.decision === 'promote') {
          student.gradeLevel = String(targetGrade)
          student.section = targetSection
          student.class = targetClass
        } else if (c.decision === 'transfer') {
          student.status = 'On Leave'
        }
      })
    },
    async () => {
      await apiClient.post('/students/promotion/execute', {
        sourceClass,
        candidates,
        targetSection,
      })
    },
  )
}

/**
 * Scholarship and enrichment programmes, for the dashboard tile.
 *
 * @apiRoute GET /api/v1/students/programs
 */
export async function fetchSpecialPrograms(): Promise<typeof specialProgramsData> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...specialProgramsData]
    },
    async () => {
      const { data } = await apiClient.get<typeof specialProgramsData>('/students/programs')
      return data
    },
  )
}

/**
 * Average performance per grade, for one semester.
 *
 * @apiRoute GET /api/v1/students/academic-performance?period={this|last}
 */
export async function fetchAcademicPerformance(
  period: 'this' | 'last',
): Promise<AcademicPerformanceEntry[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return period === 'this'
        ? [...academicPerformanceThisSemester]
        : [...academicPerformanceLastSemester]
    },
    async () => {
      const { data } = await apiClient.get<AcademicPerformanceEntry[]>(
        '/students/academic-performance',
        { params: { period } },
      )
      return data
    },
  )
}
