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

/**
 * Which department a teacher's subject belongs to.
 *
 * The faculty list is specific — 'Science - Biology', 'English Literature',
 * 'Arts - Music' — and the school's subject list is not: 'Science', 'English',
 * 'Music'. So a teacher is placed in the configured subject their own subject
 * mentions, longest match first, because 'Arts - Music' mentions both Art and
 * Music and the music teacher belongs to Music.
 *
 * A subject the school does not configure — Kannada, Urdu — is its own
 * department, which is the truth about a school of this size: one teacher, one
 * language, no department above them.
 */
export function departmentOf(subject: string): string {
  const matches = DEFAULT_SUBJECTS.map(entry => entry.name).filter(name =>
    subject.toLowerCase().includes(name.toLowerCase()),
  )
  if (matches.length > 0) {
    return matches.reduce((longest, name) => (name.length > longest.length ? name : longest))
  }
  return subject.split(' - ')[0].trim()
}

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
  // By department, not by an exact string match on the subject name. The
  // faculty list says 'Science - Biology' where the subject list says
  // 'Science', so compared for equality only Mathematics, Hindi, Computer
  // Science and PE ever matched — a Science paper was signed by whoever the
  // fallback landed on.
  const candidates = teachersData
    .map((teacher, index) => ({ teacher, index }))
    .filter(({ teacher }) => !!subject && departmentOf(teacher.subject) === subject.name)
  if (candidates.length > 0) {
    return nameOf(candidates[hash(`${classLabel}|${subjectId}`) % candidates.length].index)
  }
  return nameOf(hash(`${classLabel}|${subjectId}`))
}
