/**
 * Class/Section Utility Helpers
 *
 * Derives grade lists, section lists, and labels from a ClassSection[].
 * All functions are pure — they take data as input and return derived values.
 */

import type { ClassSection } from '@/features/timetable/types'

/**
 * Returns unique grade strings sorted numerically.
 *
 * @example getUniqueGrades(sections) → ['1', '2', '3', '5', '8', '9', '10']
 */
export function getUniqueGrades(sections: ClassSection[]): string[] {
  const grades = new Set(sections.map(s => s.grade))
  return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b))
}

/**
 * Returns section letters for a given grade, sorted alphabetically.
 *
 * @example getSectionsForGrade(sections, '8') → ['A', 'B']
 */
export function getSectionsForGrade(sections: ClassSection[], grade: string): string[] {
  return sections
    .filter(s => s.grade === grade)
    .map(s => s.section)
    .sort()
}

/**
 * Returns all class labels sorted by grade (numeric) then section (alpha).
 *
 * @example getClassLabels(sections) → ['1A', '1B', '2A', '2B', '8A', '8B', '9A']
 */
export function getClassLabels(sections: ClassSection[]): string[] {
  return [...sections]
    .sort((a, b) => {
      const gradeCompare = parseInt(a.grade) - parseInt(b.grade)
      if (gradeCompare !== 0) return gradeCompare
      return a.section.localeCompare(b.section)
    })
    .map(s => s.label)
}

/**
 * Groups sections by grade, sorted numerically.
 *
 * @example getGroupedByGrade(sections) → [['1', [{...1A}, {...1B}]], ['2', [{...2A}]]]
 */
export function getGroupedByGrade(sections: ClassSection[]): [string, ClassSection[]][] {
  const map = new Map<string, ClassSection[]>()
  for (const s of sections) {
    const list = map.get(s.grade) ?? []
    list.push(s)
    map.set(s.grade, list)
  }
  return Array.from(map.entries()).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
}

/**
 * The class label a student belongs to — '7A', '10B' — or undefined.
 *
 * Student records carry grade and section as separate fields, while every
 * class-scoped rule is written against the combined label the rest of the app
 * uses (`ClassSection.label`, the strings a teacher is assigned). Deriving it
 * here rather than adding a third stored copy keeps one source of truth: the
 * two fields the record already has.
 *
 * Undefined only when the record names no class at all. Callers deciding
 * whether a *particular* student may be edited must treat that as denied
 * rather than passing it to `can()`: an undefined field asks "may I do this
 * anywhere?", which a scoped holder answers yes to. See `canWriteStudent`.
 */
export function classSectionOf(student: {
  gradeLevel?: string
  section?: string
  class?: string
}): string | undefined {
  if (student.gradeLevel && student.section) return `${student.gradeLevel}${student.section}`
  // The other spelling. Student records carry the class two ways — six of the
  // forty as `gradeLevel` + `section`, the rest as a combined `class` — and
  // reading only the first meant this returned undefined for thirty-four of
  // them. A permission check reads undefined as "no class in hand", which is
  // the *unscoped* question, so a class-scoped teacher was allowed to edit
  // every student whose record used the second spelling.
  return student.class?.trim() || undefined
}

/**
 * May this holder write to this student's record?
 *
 * The reason this exists rather than each call site composing it: `subjectFor`
 * hands `can()` a bare subject name when every field is undefined, and a bare
 * name asks "may I edit a student *somewhere*", which a narrowed holder
 * answers yes to. So a record that can be identified on neither axis has to
 * fail closed here, where it is one decision, rather than at four call sites
 * where it was silently failing open.
 *
 * ── Why both axes, and not just the class ──────────────────────────────
 * Because a student write can now be narrowed either way. `students.update`
 * names `classes` *and* `students`, so the rule a holder gets is conditioned
 * on whichever their role is scoped by — a teacher on their sections, a
 * family on their children — and a check that only ever offered the class
 * would deny a family holder a record that is theirs.
 *
 * Offering both is safe in the other direction too: a subject carrying a
 * `studentId` the class-scoped rule does not mention still has to match that
 * rule's `classSection`, so naming the student widens nothing for a teacher.
 *
 * `id` is the profile id — the one `student_guardians` links and the scope
 * carries — not the `studentId` *code* on the record, which is the school's
 * own numbering and matches nothing.
 */
export function canWriteStudent(
  student:
    | { id?: string | number; gradeLevel?: string; section?: string; class?: string }
    | null
    | undefined,
  can: (scope: { classSection?: string; studentId?: string }) => boolean,
  isScoped: boolean,
): boolean {
  if (!student) return true
  const classSection = classSectionOf(student)
  const studentId = student.id === undefined ? undefined : String(student.id)
  if (classSection === undefined && studentId === undefined) {
    // Unscoped holders are unaffected by a record that names neither; narrowed
    // ones cannot be given the benefit of the doubt about what they are
    // touching. A record identified on one axis needs no such rule — it is
    // tested against the condition, and a rule on the other axis fails to
    // match it, which is the same fail-closed answer arrived at honestly.
    return !isScoped
  }
  return can({ classSection, studentId })
}

/**
 * The roll number as it is spoken — '15', not '07A-15'.
 *
 * Student records store the roll number prefixed with the class, because a
 * roll number is only unique inside one, and it is that long form that gets
 * printed on a form. Every screen that shows the number *next to* the class —
 * the attendance register, a mark sheet, a parent's home page — repeats the
 * class in it, so the prefix reads as a stutter. Taking the last segment here
 * rather than at each call site is the difference between three screens that
 * agree and three that each chose for themselves.
 */
export function rollNumberOf(rollNumber: string | undefined | null): string | undefined {
  const last = rollNumber?.split('-').pop()?.trim()
  return last || undefined
}
