/**
 * Mock data for Academic Performance by Grade chart on Students page.
 *
 * Rows have a `month` key plus `grade{N}` keys for every grade the admin
 * has configured. Built dynamically so the chart reflects live school config
 * instead of a hardcoded 7/8/9 slice.
 */

import { loadSchoolConfig } from '@/api/services/school-config-service'
import { getUniqueGrades } from '@/utils/class-section-helpers'

export interface AcademicPerformanceEntry {
  month: string
  [gradeKey: `grade${string}`]: number | string
}

/** Stable pseudo-random 0..1 per (grade, month) so the chart doesn't jitter per render. */
function seededFraction(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/** Realistic class-average percentage for (grade, month): 78..95%. */
function percentFor(grade: string, month: string): number {
  return Math.round(78 + seededFraction(`${grade}|${month}`) * 17)
}

function buildSeries(months: string[]): AcademicPerformanceEntry[] {
  const grades = getUniqueGrades(loadSchoolConfig().classSections)
  return months.map(month => {
    // Seed with the required `month` so the object satisfies the interface
    // outright — the previous `Record<string, …>` needed an unsound cast.
    const row: AcademicPerformanceEntry = { month }
    grades.forEach(g => {
      row[`grade${g}`] = percentFor(g, month)
    })
    return row
  })
}

export const academicPerformanceLastSemester: AcademicPerformanceEntry[] = buildSeries([
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
])

export const academicPerformanceThisSemester: AcademicPerformanceEntry[] = buildSeries([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
])
