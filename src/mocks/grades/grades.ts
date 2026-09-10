/**
 * Seeded grade submissions.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * One class. 9A had Unit Test 1 published across every subject and a
 * half-yearly Maths draft; the other eighteen sections had never been marked.
 * So the grade sheet was empty for 95% of the school, a report card could only
 * be printed for one class, and the "published" flag that gates whether a
 * family can read a mark was only ever exercised by twenty students.
 *
 * The marks were also drawn with `Math.random()`, which meant they changed on
 * every page load. A teacher opening a mark sheet twice saw two different sets
 * of marks, and no bug about a particular mark could be reproduced. They come
 * off a seeded stream now.
 *
 * ── What exists, and why that shape ────────────────────────────────────
 * Two unit tests, published, for every class and every gradeable subject —
 * because by the middle of September a school has marked two unit tests. The
 * half yearly has not been sat yet, so there is nothing for it except a single
 * draft one teacher started early, which is what keeps the draft state
 * demonstrable. Everything after that is a blank sheet, correctly.
 */

import { classRosters } from '@/mocks/attendance/daily'
import { findStudent } from '@/mocks/students/store'
import { GRADEABLE_SUBJECT_IDS, EXAMS } from '@/features/grades/constants'
import { tenantSections } from '@/mocks/tenants'
import { relativeDate } from '@/mocks/_shared/date-helpers'
import { subjectTeacherOf } from '@/mocks/teachers/assignments'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, bell, type Rng } from '@/mocks/tenants/_generate/random'
import type { GradeSubmission, GradeEntry } from '@/features/grades/types'

// ============================================================================
// Helpers
// ============================================================================

/**
 * How well one student generally does, as a percentage.
 *
 * Read off their own record, not drawn. Two reasons.
 *
 * Per student rather than per mark, because a mark drawn independently per
 * subject produces a report card like "Maths 18, Hindi 41, Science 39" for the
 * same child — nobody is that uneven, and a report card built on it says
 * nothing a teacher could act on. A student has a standard and a subject moves
 * them off it, which is what makes "weak in Maths" a readable signal.
 *
 * And off the record rather than off a stream of its own, because the students
 * page, the detail page's GPA and this mark sheet are three views of one
 * child's academic standing. Drawn separately they disagreed: the directory
 * called her a 67% student and her mark sheet averaged 83%, and there is no
 * reading of the data in which both are true.
 *
 * Filler roster rows — a class with nobody enrolled still gets a register —
 * carry ids that resolve to no student, so those fall back to a draw.
 */
const abilities = new Map<string, number>()
function abilityOf(studentId: string): number {
  const cached = abilities.get(studentId)
  if (cached !== undefined) return cached
  const student = findStudent(studentId)
  const source = rng(`${activeTenant()}:ability:${studentId}`)
  const ability =
    student?.percentage ?? (source() < 0.9 ? bell(source, 52, 97) : bell(source, 26, 56))
  abilities.set(studentId, ability)
  return ability
}

/**
 * A mark out of `maxMarks` for one student in one subject.
 *
 * Their general standard, plus a subject swing of up to about twelve points —
 * enough for a favourite subject and a weak one to be visible, not enough to
 * make the same child top of one class and failing the next.
 */
function marksFor(source: Rng, studentId: string, maxMarks: number): number {
  const swing = (bell(source, -1, 1)) * 12
  const percent = Math.min(99, Math.max(12, abilityOf(studentId) + swing))
  return Math.round((percent / 100) * maxMarks)
}

/** Build a blank entry for a student */
/** @internal Build a blank entry for a student */
export function blankEntry(studentId: string, studentName: string, rollNumber: string, maxMarks: number): GradeEntry {
  return { studentId, studentName, rollNumber, marksObtained: null, maxMarks, remarks: '' }
}

// ============================================================================
// Pre-populated Submissions
// ============================================================================

/** Unit tests one and two — sat, marked, and released. */
const PUBLISHED_EXAM_IDS = ['ut1', 'ut2'] as const

/** How long ago each was submitted, in days. */
const SUBMITTED_DAYS_AGO: Record<string, number> = { ut1: -104, ut2: -58 }

function makeSubmission(
  classId: string,
  examId: string,
  subjectId: string,
  options: { published: boolean; filledUpTo?: number },
): GradeSubmission | null {
  const exam = EXAMS.find(entry => entry.id === examId)
  const roster = classRosters[classId] ?? []
  if (!exam || roster.length === 0) return null

  const source = rng(`${activeTenant()}:marks:${classId}:${examId}:${subjectId}`)
  const filledUpTo = options.filledUpTo ?? roster.length

  return {
    id: `sub-${classId.toLowerCase()}-${examId}-${subjectId}`,
    classId,
    examId,
    subjectId,
    entries: roster.map((student, index) => ({
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      marksObtained: index < filledUpTo ? marksFor(source, student.id, exam.maxMarks) : null,
      maxMarks: exam.maxMarks,
      remarks: '',
    })),
    // Published, not merely submitted. The status gates whether a family can
    // read the marks, so a school with nothing published would show every
    // parent an empty page and look broken rather than careful.
    status: options.published ? 'published' : 'draft',
    submittedBy: subjectTeacherOf(classId, subjectId),
    submittedAt: relativeDate(SUBMITTED_DAYS_AGO[examId] ?? -30).toISOString(),
  }
}

const seededSubmissions: GradeSubmission[] = tenantSections().flatMap(section =>
  PUBLISHED_EXAM_IDS.flatMap(examId =>
    GRADEABLE_SUBJECT_IDS.map(subjectId =>
      makeSubmission(section.label, examId, subjectId, { published: true }),
    ),
  ),
).filter((submission): submission is GradeSubmission => submission !== null)

// One teacher has started entering half-yearly Maths for 9A before the exam
// has been sat — a partly-filled draft, which is the state the grade-entry
// screen's save-and-come-back-later path exists for. Deliberately one, so
// "draft" stays visible without pretending the school has marked a paper it
// has not written yet.
const halfYearlyDraft = makeSubmission('9A', 'half', 'math', {
  published: false,
  filledUpTo: 8,
})
if (halfYearlyDraft) seededSubmissions.push(halfYearlyDraft)

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
