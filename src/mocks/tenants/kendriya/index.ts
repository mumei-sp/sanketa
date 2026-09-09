/**
 * Kendriya Vidyalaya's schema contents.
 *
 * The default school, and the one every screenshot and demo has been against:
 * forty students across grades 7 to 9, their guardians embedded on the
 * records the way the school's own records carry them.
 *
 * Only seed data lives here. The tables themselves are shared — a school does
 * not get its own `students` table any more than it gets its own `CREATE
 * TABLE`, it gets its own rows.
 */

import { studentFixtures } from './students'
import type { TenantFixtures } from '../types'

export const kendriya: TenantFixtures = {
  students: studentFixtures,
  access: {
    profiles: [
      { id: 'UP-1', userId: '1', staffId: 'E-0001' },
      { id: 'UP-2', userId: '2', staffId: 'E-0002' },
      {
        id: 'UP-3',
        userId: '3',
        teacherId: 'T-1006',
        assignedClasses: ['8A', '8B'],
        // Her own child is in 9B, a class she does not teach. The member of
        // staff whose child attends the school is the case a single role per
        // person could never express, so it lives in the seed and cannot
        // regress unnoticed.
        parentPhone: '9880114477',
      },
      { id: 'UP-4', userId: '4', staffId: 'E-0004' },
    ],
    roles: [
      { profileId: 'UP-1', roleId: 'admin' },
      { profileId: 'UP-2', roleId: 'principal' },
      { profileId: 'UP-3', roleId: 'teacher' },
      { profileId: 'UP-3', roleId: 'parent' },
      { profileId: 'UP-4', roleId: 'accountant' },
    ],
    typeCodes: [
      { profileId: 'UP-1', code: 'admin', isPrimary: true },
      { profileId: 'UP-2', code: 'staff', isPrimary: true },
      { profileId: 'UP-3', code: 'teacher', isPrimary: true },
      { profileId: 'UP-3', code: 'parent' },
      { profileId: 'UP-4', code: 'staff', isPrimary: true },
    ],
  },
}
