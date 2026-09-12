/**
 * May this caller write to this student's record?
 *
 * One answer, shared by every service that changes something about a student —
 * the record itself in `student-service`, the health, behaviour, document and
 * scholarship rows under it in `student-detail-service`. Kept here rather than
 * in either of them because a guard that lives in one service is a guard the
 * next service forgets, which is how the detail writes went unasked in the
 * first place.
 *
 * ── Why a record check and not the bare permission ─────────────────────
 * Every student write declares both scope axes, so the rule a holder gets is
 * conditioned on whichever their role is narrowed by — a teacher on their
 * sections, a family on their children. `callerMay('update', 'Student')` asks
 * the unconditioned question, "may I edit a student *somewhere*", which a
 * narrowed holder answers yes to for the whole roster. So the record is looked
 * up and the rule is tested against it, exactly as the reads do on the way out.
 *
 * The counterpart on the rendering side is `canWriteStudent`, which asks the
 * same question of the same two fields so that what a page offers and what a
 * service permits cannot disagree.
 */

import { visibleRecordToCaller } from './caller'
import { findStudent } from '@/mocks/tenant/students/store'
import { classSectionOf } from '@/utils/class-section-helpers'
import type { SubjectFields } from '@/config/ability'
import type { Action } from '@/config/permissions'

/** As much of a student as a scope decision needs. A draft form value qualifies. */
export interface StudentLike {
  /** The profile id — what `student_guardians` links and the scope carries. */
  id?: string | number
  gradeLevel?: string
  section?: string
  class?: string
}

/**
 * The record, in the terms a rule is written about.
 *
 * `undefined` when it can be placed on neither axis, which `visibleToCaller`
 * reads as "withhold". That is not the same as passing an object of undefined
 * fields: `subjectFor` turns those back into a bare subject name, and a bare
 * name is the "anywhere?" question a narrowed holder passes. The difference
 * is the whole fail-closed guarantee, so it is made here once.
 */
function keyOf(student: StudentLike): SubjectFields | undefined {
  const studentId = student.id === undefined ? undefined : String(student.id)
  const classSection = classSectionOf(student)
  if (studentId === undefined && classSection === undefined) return undefined
  return { studentId, classSection }
}

/**
 * May this caller take this action on this student?
 *
 * Takes the record rather than an id because the caller sometimes does not
 * have one: enrolling a student is a `create` against a class that is still a
 * value on a form.
 */
export function mayWriteStudent(student: StudentLike | undefined, action: Action): boolean {
  return visibleRecordToCaller(student, action, 'Student', keyOf) !== undefined
}

/**
 * Refuse unless this caller may edit this student.
 *
 * `what` completes "Not allowed to …" — `'add a health record'`, `'edit this
 * student'` — so the refusal names the attempt rather than the subject.
 */
export function assertMayEditStudent(studentId: string, what: string): void {
  if (!mayWriteStudent(findStudent(studentId), 'update')) {
    throw new Error(`Not allowed to ${what}.`)
  }
}

/** Refuse unless this caller may enrol a student into the class this draft names. */
export function assertMayEnrolStudent(draft: StudentLike): void {
  if (!mayWriteStudent(draft, 'create')) {
    const into = classSectionOf(draft)
    throw new Error(
      into ? `Not allowed to enrol a student into ${into}.` : 'Not allowed to enrol a student.',
    )
  }
}
