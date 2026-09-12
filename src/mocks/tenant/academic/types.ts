/**
 * `academic-mgmt` — the tables the rest of the school hangs off.
 *
 * Ported from `feature/db-schema:modules/academic-mgmt/schema.sql` rather than
 * invented, so adoption is a mapping. Postgres enums become string unions and
 * UUIDs become strings; nothing else is reshaped.
 *
 * ── Why this module mattered more than its size ────────────────────────
 * Until it existed, a class section was a bare string. `'8B'` on a student,
 * `'8B'` on a teacher's assignment, `'8B'` on a register and `'8B'` in a
 * timetable, with nothing to point at and nothing to say how many children fit
 * in it or who takes it. Three consequences the app actually carried:
 *
 * A class had no class teacher, so `classTeacherOf` picked one by hashing the
 * label. `class_sections.class_teacher_id` is the column that was missing.
 *
 * A class had no capacity, so "full" was a word nobody could evaluate.
 *
 * And subjects were the *app's* ten, not a school's, so Vidya Mandir's Kannada
 * teachers taught a subject the timetable had no slot for. `subjects` is
 * tenant data with a `department`, which is what lets a school teach what it
 * actually teaches.
 */

export type AcademicYearStatus = 'planning' | 'active' | 'completed' | 'archived'
export type TermType = 'semester' | 'trimester' | 'quarter' | 'annual'
export type GradeLevelType = 'elementary' | 'middle' | 'high' | 'special'
export type SubjectType = 'core' | 'elective' | 'extracurricular' | 'remedial' | 'advanced'
export type SectionStatus = 'planning' | 'active' | 'completed' | 'suspended' | 'cancelled'

export interface AcademicYear {
  id: string
  name: string
  /** `2026-27`. Unique. */
  code: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
  /** At most one. The year every unqualified query means. */
  isCurrent: boolean
  totalWorkingDays: number
  totalHolidays: number
  /** `grade_scale_config` — the scale marks are read on. */
  gradeScale: { scale: 'percentage' | 'letter' | 'points' | 'pass_fail'; passingGrade: number }
  /** `attendance_policy`. */
  attendancePolicy: { minAttendance: number }
}

export interface Term {
  id: string
  academicYearId: string
  name: string
  /** Unique within the year. */
  code: string
  termType: TermType
  startDate: string
  endDate: string
  isCurrent: boolean
  /** When the term's examinations run, if they are scheduled yet. */
  examPeriodStart?: string
  examPeriodEnd?: string
}

export interface GradeLevel {
  id: string
  /** `Class 8`. */
  name: string
  /** `8`. Unique, and what a student's `gradeLevel` holds today. */
  code: string
  /** Sort order. Class 10 must not come after Class 1 alphabetically. */
  levelOrder: number
  gradeLevelType: GradeLevelType
}

export interface ClassSection {
  id: string
  gradeLevelId: string
  /** `Class 8 B`. */
  name: string
  /** `B` — the section letter. Unique per grade per year. */
  code: string
  /** How many fit. The column that makes "full" a question with an answer. */
  capacity: number
  /** How many are in it. Counted from the roster, not typed. */
  currentEnrollment: number
  academicYearId: string
  termId?: string
  status: SectionStatus
  /**
   * Who takes this class — `user_profiles.id`.
   *
   * The column whose absence made `classTeacherOf` hash a label. A section has
   * one class teacher and a school decides which; it is not derivable from a
   * timetable, because teaching a class is not the same as being responsible
   * for it.
   */
  classTeacherId?: string
  isActive: boolean
}

export interface Subject {
  id: string
  name: string
  /** `math`, `kannada`. Unique. */
  code: string
  subjectType: SubjectType
  description?: string
  /** Which department owns it — the join to a teacher's own subject. */
  department?: string
  isActive: boolean
}

/**
 * How many periods a week each subject gets, by band.
 *
 * **Not one of the five tables.** The schema it wants to be is
 * `grade_level_subjects(grade_level_id, subject_id, periods_per_week)`, which
 * neither backend branch designs yet — so this is the frontend's statement of
 * the shape rather than a port of one, and it is kept apart from the tables
 * above so nobody mistakes it for a ported column.
 *
 * It has to live somewhere: a school decides that Kannada gets four periods
 * in the primary years, and until it could say so its Kannada teacher had a
 * department, a payroll line, and no lesson to teach.
 */
export interface CurriculumEntry {
  /** → `subjects.code`. */
  subjectCode: string
  /** Periods a week in Classes 1–5. */
  junior: number
  /** Periods a week in Classes 6–10. */
  senior: number
}

/** The five tables, written together and read together. */
export interface AcademicFixtures {
  years: AcademicYear[]
  terms: Term[]
  gradeLevels: GradeLevel[]
  sections: ClassSection[]
  subjects: Subject[]
  /** See `CurriculumEntry` — the one thing here that is not a ported table. */
  curriculum: CurriculumEntry[]
}
