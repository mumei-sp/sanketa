/**
 * Vidya Mandir's schema contents.
 *
 * The second school. Eight students, and one role Kendriya does not have —
 * which is the point of roles being a school's own data rather than the app's.
 *
 * No `access`: nobody has a profile here yet. That is deliberate and it is the
 * honest state of a school that has been created and not staffed. A login can
 * hold a membership here and be nobody in it, and the app has to mean that
 * rather than quietly inheriting whoever the other school employs.
 */

import { studentFixtures } from './students'
import { teacherFixtures } from './teachers'
import type { TenantFixtures } from '../types'

export const vidyaMandir: TenantFixtures = {
  students: studentFixtures,
  teachers: teacherFixtures,
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
