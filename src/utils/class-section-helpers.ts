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
 * The reason this exists rather than each call site composing it: passing an
 * undefined `classSection` to `can()` does not ask "may I edit this student",
 * it asks "may I edit a student somewhere", and a scoped teacher answers yes.
 * So a record whose class cannot be determined has to fail closed here, where
 * it is one decision, rather than at four call sites where it was silently
 * failing open.
 */
export function canWriteStudent(
  student: { gradeLevel?: string; section?: string; class?: string } | null | undefined,
  can: (scope: { classSection: string }) => boolean,
  isScoped: boolean,
): boolean {
  if (!student) return true
  const classSection = classSectionOf(student)
  if (classSection === undefined) {
    // Unscoped holders are unaffected by a missing class; scoped ones cannot
    // be given the benefit of the doubt about which class they are touching.
    return !isScoped
  }
  return can({ classSection })
}
