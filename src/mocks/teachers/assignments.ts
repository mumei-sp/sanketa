/**
 * Who teaches what, derived from the faculty list.
 *
 * ── Why derived ────────────────────────────────────────────────────────
 * The attendance and grade fixtures each carried their own three-entry map of
 * class → teacher, and every class outside it fell back to the string
 * `'Admin'`. So sixteen of nineteen registers were submitted by nobody in
 * particular, the same register was signed by two different people on the two
 * screens that showed it, and a name in that column pointed at no row in the
 * staff directory.
 *
 * A teacher row already states its `subject` and its `assignedClasses`. This
 * reads them, so the name on a register is a member of staff, and the name on
 * a mark sheet is somebody who teaches that subject to that class.
 *
 * ── The gap it papers over ─────────────────────────────────────────────
 * The school has nineteen sections and eighteen teachers holding two classes
 * each, and no table says which of a class's teachers is *its* class teacher —
 * `teacher_classes` has no role column, and there is no `class_sections` table
 * to hang one off (SCHEMA-FIXES §5.1). So the class teacher here is a choice
 * this file makes, deterministically, rather than a fact it looks up. When the
 * academic-management tables land, this becomes a join and the guessing goes.
 */

import { teachersData } from './teachers'
import { DEFAULT_SUBJECTS } from '@/config/school-config'

const nameOf = (index: number) => {
  const teacher = teachersData[index % teachersData.length]
  return teacher.fullName ?? teacher.displayName ?? `${teacher.firstName} ${teacher.lastName}`
}

/** Stable index from a string, so the same class always gets the same teacher. */
function hash(text: string): number {
  let value = 0
  for (let i = 0; i < text.length; i += 1) {
    value = (Math.imul(31, value) + text.charCodeAt(i)) | 0
  }
  return Math.abs(value)
}

/**
 * The teacher who takes the register for a class.
 *
 * Prefers somebody the faculty list actually assigns to it. Nineteen sections
 * against thirty-six assignments means most classes have one; the rest get a
 * stable pick, because a register signed by "Admin" is a register nobody
 * signed.
 */
export function classTeacherOf(classLabel: string): string {
  const assigned = teachersData.findIndex(teacher =>
    teacher.assignedClasses?.includes(classLabel),
  )
  return nameOf(assigned >= 0 ? assigned : hash(classLabel))
}

/**
 * The teacher who marks one subject for one class.
 *
 * Matched on the subject they teach, so a Mathematics paper is not signed by
 * the Hindi teacher. Falls back to a stable pick when the faculty list has
 * nobody for a subject — which is itself true of a real timetable, where a
 * subject with no specialist is covered by whoever is free.
 */
export function subjectTeacherOf(classLabel: string, subjectId: string): string {
  const subject = DEFAULT_SUBJECTS.find(entry => entry.id === subjectId)
  const candidates = teachersData
    .map((teacher, index) => ({ teacher, index }))
    .filter(({ teacher }) => teacher.subject === subject?.name)
  if (candidates.length > 0) {
    return nameOf(candidates[hash(`${classLabel}|${subjectId}`) % candidates.length].index)
  }
  return nameOf(hash(`${classLabel}|${subjectId}`))
}
