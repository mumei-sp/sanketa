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
import type { TenantFixtures } from '../types'

export const vidyaMandir: TenantFixtures = {
  students: studentFixtures,
  teachers: teacherFixtures,
  access: {
    profiles: [
      {
        id: 'VM-UP-1',
        // The same `users.id` as Kendriya's UP-5 — one login, two schools,
        // two profiles. The profile ids are this school's own, which is what
        // schema-per-tenant means: `UP-5` here would be a different row from
        // `UP-5` there, so they are named apart to keep a log readable.
        userId: '5',
        // Ira Sharma's father, joined to her by the number her record names.
        parentPhone: '9845123457',
      },
    ],
    roles: [{ profileId: 'VM-UP-1', roleId: 'parent' }],
    typeCodes: [{ profileId: 'VM-UP-1', code: 'parent', isPrimary: true }],
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
