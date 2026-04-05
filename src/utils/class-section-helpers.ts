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
