/**
 * Vidya Mandir's schema contents.
 *
 * The second school: 317 students in a different city, its own staff room of
 * thirty-three, and one role Kendriya does not have — which is the point of
 * roles being a school's own data rather than the app's.
 *
 * One profile, and it is a parent's. Rohan Sharma has a daughter here and a
 * son at Kendriya, on one account and two memberships — the case the global
 * identity tables exist for, asserted from both ends so neither folder can
 * drift alone.
 *
 * Nobody on the staff holds an account here yet, which is the honest state of
 * a school whose records have been loaded and whose staff have not been
 * invited. A login can hold a membership and be nearly nobody in it, and the
 * app has to mean that rather than quietly inheriting whoever the other school
 * employs — which, until the faculty moved into these folders, it did.
 */

import { studentFixtures } from './students'
import { teacherFixtures } from './teachers'
import { transportFixtures } from './transport'
import { expenseFixtures } from './expenses'
import { academicFixtures } from './academic'
import { withClassTeachers } from '../_generate/academic'
import { schedulingFixtures } from './scheduling'
import { configFixture } from './config'
import { noticeFixtures } from './notices'
import { calendarFixtures } from './calendar'
import { todoFixtures } from './todos'
import type { TenantFixtures } from '../types'

export const vidyaMandir: TenantFixtures = {
  students: studentFixtures,
  teachers: teacherFixtures,
  transport: transportFixtures,
  expenses: expenseFixtures,
  // Who takes each class, from the faculty's own assignments — the one
  // place that knows both sides.
  academic: withClassTeachers(academicFixtures, teacherFixtures),
  scheduling: schedulingFixtures,
  config: configFixture,
  notices: noticeFixtures,
  calendar: calendarFixtures,
  todos: todoFixtures,
  access: {
    profiles: [
      {
        key: 'rohan',
        // The same `users.id` as Kendriya's — one login, two schools, two
        // profiles. The profile ids are this school's own, which is what
        // schema-per-tenant means.
        userId: '5',
        // Ira Sharma's father, found by the number her record names.
        guardianPhone: '9845123457',
      },
    ],
    roles: [{ key: 'rohan', roleId: 'parent' }],
  },
  extraRoles: [
    {
      id: 'librarian',
      name: 'Librarian',
      description: 'Runs the library. Can look people up and read notices.',
      // Not narrowed: a librarian serves the whole school.
      permissions: ['dashboard.read', 'students.read', 'teachers.read', 'notices.read'],
    },
  ],
}
