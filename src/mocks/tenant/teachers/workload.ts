/**
 * Teaching load per department, built from the faculty list.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Ten hand-written casts of five names each — Giana Gomez, Miley Addams,
 * Kaily Jayson, Rayan Yasmine, Aliyah Summer, Zackary Smith, Javier
 * Quintero — recycled across departments, none of them on the faculty list
 * and none of them Indian. So the workload chart on the Teachers page named
 * seven people who did not work at the school, directly above a list of the
 * eighteen who did. Their loads were a base number plus a deterministic
 * wobble, unconnected to how many classes anybody actually holds.
 *
 * Now a department's bars are its own teachers, and the load is the load their
 * `assignedClasses` implies.
 */

import type { TeacherWorkloadData } from '@/features/teachers/types'
import { teachersData } from './teachers'
import { departmentOf } from './assignments'
import { DEFAULT_SUBJECTS } from '@/config/school-config'

/** One teaching period, in hours — see `DEFAULT_PERIODS`: 45 minutes. */
const PERIOD_HOURS = 0.75

/** Periods a week a teacher takes in each class they hold. */
const PERIODS_PER_CLASS = 5

/**
 * What one teacher's week looks like.
 *
 * Classes come from how many sections they hold, which is the only fact the
 * faculty list actually carries about load. Extra duties — exam invigilation,
 * bus rota, assembly — are deterministic per teacher rather than random, so
 * the chart does not rearrange itself between two looks at it.
 */
function loadFor(teacher: (typeof teachersData)[number], multiplier: number): TeacherWorkloadData {
  const sections = teacher.assignedClasses?.length ?? 0
  const classes = sections * PERIODS_PER_CLASS
  const dutySeed = teacher.teacherId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return {
    teacherName: teacher.fullName ?? teacher.displayName ?? teacher.teacherId,
    totalClasses: Math.round(classes * multiplier),
    teachingHours: Math.round(classes * PERIOD_HOURS * multiplier),
    extraDuties: Math.round((2 + (dutySeed % 5)) * multiplier),
  }
}

/**
 * Which teachers belong to a department.
 *
 * `departmentOf` places each teacher in exactly one, so the music teacher does
 * not also appear under Art. A department with nobody in it is left out of the
 * map entirely, which is what makes the chart's selector offer only the
 * departments it can actually draw.
 */
function facultyIn(subjectName: string): typeof teachersData {
  return teachersData.filter(teacher => departmentOf(teacher.subject) === subjectName)
}

export const teacherWorkloadData: Record<string, Record<string, TeacherWorkloadData[]>> =
  Object.fromEntries(
    DEFAULT_SUBJECTS.map(subject => {
      const faculty = facultyIn(subject.name)
      if (faculty.length === 0) return null
      return [
        subject.name,
        {
          Weekly: faculty.map(teacher => loadFor(teacher, 1)),
          // Four teaching weeks in a month, near enough for a bar chart.
          Monthly: faculty.map(teacher => loadFor(teacher, 4)),
        },
      ] as const
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  )
