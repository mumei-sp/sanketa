/**
 * Vidya Mandir's schema contents.
 *
 * The second school. Eight students, and one role Kendriya does not have —
 * which is the point of roles being a school's own data rather than the app's.
 */

import { studentFixtures } from './students'
import type { TenantFixtures } from '../types'

export const vidyaMandir: TenantFixtures = {
  students: studentFixtures,
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
