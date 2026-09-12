/**
 * A school's academic year, in the `academic-mgmt` shape.
 *
 * ── What a school states, and what follows ────────────────────────────
 * A school says which grades it runs, how many sections in each and how big
 * they are, and what it teaches. Everything else — the year's dates, its three
 * terms, their exam windows, the section ids, the grade ordering — follows,
 * because those are the same at every school that keeps an April-to-March
 * year, which is every school in India.
 *
 * The alternative is a school folder restating five tables, and five tables
 * restated twice drift.
 */

import type {
  AcademicFixtures,
  AcademicYear,
  ClassSection,
  GradeLevel,
  Subject,
  Term,
} from '@/mocks/tenant/academic/types'

/** One grade, and the sections it runs. */
export interface GradeSpec {
  /** `8`. */
  grade: string
  /** `['A', 'B']`. */
  sections: readonly string[]
  /** Seats per section. A school knows this; the roster fills toward it. */
  capacity: number
}

export interface AcademicConfig {
  /** Seed namespace and id prefix — the school's code. */
  code: string
  /** The April the current academic year began. */
  yearStart: number
  grades: readonly GradeSpec[]
  /**
   * What the school teaches, and how much of it.
   *
   * Its own list, not the app's — and the period counts are its own too. Both
   * bands must add to the periods in a week, or the timetable generator is
   * asked for a week that does not exist.
   */
  subjects: readonly (Omit<Subject, 'id' | 'isActive'> & {
    junior: number
    senior: number
  })[]
}

/**
 * Which band a grade sits in.
 *
 * India's own split rather than the American one the enum is named for:
 * primary to 5, middle to 8, secondary after. The enum values are the
 * schema's and are not ours to rename.
 */
function bandFor(grade: number): GradeLevel['gradeLevelType'] {
  if (grade <= 5) return 'elementary'
  if (grade <= 8) return 'middle'
  return 'high'
}

/**
 * The three terms an Indian school year is cut into.
 *
 * April to March, with the examinations that close each: the unit tests and
 * half yearly in term one, the annual in term three. Dated from the year's own
 * start so a school in its second year needs no new fixture.
 */
const TERM_SPANS: readonly {
  code: string
  name: string
  startMonth: number
  endMonth: number
  examStartMonth: number
  examEndMonth: number
}[] = [
  // Months are 0-indexed, as `Date` has them: 3 is April, 11 is December.
  { code: 'T1', name: 'Term 1', startMonth: 3, endMonth: 8, examStartMonth: 8, examEndMonth: 8 },
  { code: 'T2', name: 'Term 2', startMonth: 9, endMonth: 11, examStartMonth: 11, examEndMonth: 11 },
  { code: 'T3', name: 'Term 3', startMonth: 0, endMonth: 2, examStartMonth: 2, examEndMonth: 2 },
]

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const lastDay = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

export function generateAcademic(config: AcademicConfig): AcademicFixtures {
  const p = config.code === 'kendriya' ? '' : `${config.code}-`
  const start = config.yearStart
  const end = start + 1

  const yearId = `${p}ay-${start}`
  const year: AcademicYear = {
    id: yearId,
    name: `${start}–${String(end).slice(2)}`,
    code: `${start}-${String(end).slice(2)}`,
    startDate: iso(start, 3, 1),
    endDate: iso(end, 2, 31),
    status: 'active',
    isCurrent: true,
    // A CBSE year is 220 working days, less the holidays a state actually
    // takes — which is why this is a column and not a constant.
    totalWorkingDays: 220,
    totalHolidays: 52,
    gradeScale: { scale: 'percentage', passingGrade: 33 },
    attendancePolicy: { minAttendance: 75 },
  }

  const now = new Date()
  const terms: Term[] = TERM_SPANS.map(span => {
    // Terms two and three of an April year fall in the next calendar year for
    // January onward; the month numbers above say which.
    const calendarYear = span.startMonth >= 3 ? start : end
    const examYear = span.examStartMonth >= 3 ? start : end
    return {
      id: `${p}term-${span.code.toLowerCase()}-${start}`,
      academicYearId: yearId,
      name: span.name,
      code: span.code,
      termType: 'trimester',
      startDate: iso(calendarYear, span.startMonth, 1),
      endDate: iso(
        span.endMonth >= 3 ? start : end,
        span.endMonth,
        lastDay(span.endMonth >= 3 ? start : end, span.endMonth),
      ),
      isCurrent: false,
      examPeriodStart: iso(examYear, span.examStartMonth, 10),
      examPeriodEnd: iso(examYear, span.examEndMonth, lastDay(examYear, span.examEndMonth)),
    }
  })

  // Exactly one current term, decided by today rather than declared — a
  // fixture that names the current term is wrong for nine months of the year.
  const current =
    terms.find(term => new Date(term.startDate) <= now && now <= new Date(term.endDate)) ?? terms[0]
  current.isCurrent = true

  const gradeLevels: GradeLevel[] = config.grades.map((spec, index) => ({
    id: `${p}gl-${spec.grade}`,
    name: `Class ${spec.grade}`,
    code: spec.grade,
    levelOrder: index + 1,
    gradeLevelType: bandFor(Number(spec.grade)),
  }))

  const sections: ClassSection[] = config.grades.flatMap(spec =>
    spec.sections.map(letter => ({
      id: `cls-${spec.grade}${letter.toLowerCase()}`,
      gradeLevelId: `${p}gl-${spec.grade}`,
      name: `Class ${spec.grade} ${letter}`,
      code: letter,
      capacity: spec.capacity,
      // Counted off the roster when the store seeds — see its `seed()`.
      currentEnrollment: 0,
      academicYearId: yearId,
      status: 'active' as const,
      // Filled from the faculty list, which states who takes which class.
      isActive: true,
    })),
  )

  const subjects: Subject[] = config.subjects.map(({ junior, senior, ...subject }) => {
    void junior
    void senior
    return { ...subject, id: `${p}sub-${subject.code}`, isActive: true }
  })

  const curriculum = config.subjects.map(subject => ({
    subjectCode: subject.code,
    junior: subject.junior,
    senior: subject.senior,
  }))

  return { years: [year], terms, gradeLevels, sections, subjects, curriculum }
}

/**
 * `[{ grade: '8', section: 'B', label: '8B' }, …]`, in teaching order.
 *
 * For the seeds that need the section list before any store exists — a
 * school's roster and its faculty are built from its own folder, and the
 * academic store is seeded from the roster, so they cannot ask it without a
 * cycle.
 */
export function sectionLabels(
  fixtures: AcademicFixtures,
): { grade: string; section: string; label: string }[] {
  const order = new Map(fixtures.gradeLevels.map(level => [level.id, level]))
  return [...fixtures.sections]
    .sort((a, b) => {
      const ga = order.get(a.gradeLevelId)?.levelOrder ?? 0
      const gb = order.get(b.gradeLevelId)?.levelOrder ?? 0
      return ga - gb || a.code.localeCompare(b.code)
    })
    .map(section => {
      const grade = order.get(section.gradeLevelId)?.code ?? ''
      return { grade, section: section.code, label: `${grade}${section.code}` }
    })
}

/**
 * Fill in who takes each class, from the faculty's own assignments.
 *
 * `class_sections.class_teacher_id` is a column a school sets, and the school
 * has already said it: `assignedClasses` on a teacher names the sections they
 * hold. This is the one place that knows both, because a school's folder
 * imports its academic tables *and* its staff list — which the academic store
 * deliberately cannot do, since its own seed comes from those fixtures.
 *
 * The first teacher holding a section is its class teacher. A section with two
 * teachers has one of them responsible for it, and the list's order is the
 * school's answer to which.
 */
export function withClassTeachers(
  fixtures: AcademicFixtures,
  faculty: readonly { id: string | number; assignedClasses?: string[] }[],
): AcademicFixtures {
  return {
    ...fixtures,
    sections: fixtures.sections.map(section => {
      const grade = fixtures.gradeLevels.find(level => level.id === section.gradeLevelId)
      const label = `${grade?.code ?? ''}${section.code}`
      const holder = faculty.find(teacher => teacher.assignedClasses?.includes(label))
      return { ...section, classTeacherId: holder ? String(holder.id) : undefined }
    }),
  }
}
