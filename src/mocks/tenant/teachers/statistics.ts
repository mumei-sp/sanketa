/**
 * The teachers dashboard's aggregates, counted off the faculty list.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Four hardcoded numbers — 86 total, 62 full-time, 18 part-time, 6
 * substitute — over a faculty list of eighteen, and a department table
 * distributing those 86 across ten departments. So the Teachers page said 86
 * and the dashboard tile said 90 (18 × a multiplier) and the list below both
 * of them held eighteen people, and no two of the three agreed.
 *
 * A count is a count of rows. These count rows.
 */

import type { DepartmentData, TeacherStatistics } from '@/features/teachers/types'
import type { EmploymentType } from '@/features/teachers/types/teacher-detail'
import { teachersData } from './teachers'
import { departmentOf } from './assignments'

const countOf = (kind: EmploymentType) =>
  teachersData.filter(teacher => teacher.employmentType === kind).length

export const teacherStatisticsData: TeacherStatistics = {
  total: teachersData.length,
  fullTime: countOf('Full-Time'),
  partTime: countOf('Part-Time'),
  substitute: countOf('Substitute'),
}

/**
 * Teacher counts by department, largest first.
 *
 * Percentages are of the real total, so they add to 100 rather than to
 * whatever the hardcoded rows happened to sum to.
 */
export const departmentDistributionData: DepartmentData[] = (() => {
  const counts = new Map<string, number>()
  teachersData.forEach(teacher => {
    const department = departmentOf(teacher.subject)
    counts.set(department, (counts.get(department) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / teachersData.length) * 100),
    }))
})()
