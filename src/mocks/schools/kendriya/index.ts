/**
 * Kendriya Vidyalaya's schema contents.
 *
 * The default school, and the one every screenshot and demo has been against:
 * 441 students across all nineteen sections, their guardians embedded on the
 * records the way the school's own records carry them, and a staff room of
 * thirty-one.
 *
 * Only seed data lives here. The tables themselves are shared — a school does
 * not get its own `students` table any more than it gets its own `CREATE
 * TABLE`, it gets its own rows.
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

export const kendriya: TenantFixtures = {
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
        key: 'admin',
        userId: '1',
        id: 'UP-1',
        fullName: 'Surya Admin',
        staff: { employeeId: 'E-0001', designation: 'Administrator', department: 'Administration' },
      },
      {
        key: 'principal',
        userId: '2',
        id: 'UP-2',
        fullName: 'Nandini Rao',
        staff: { employeeId: 'E-0002', designation: 'Principal', department: 'Administration' },
      },
      {
        key: 'meera',
        userId: '3',
        // Her *teacher row* is her profile — `t-6` in the faculty list, which
        // is T-1006. Not a pointer to it: under the schema a teacher takes
        // `profile_id` as its own primary key, so the ids are the same id.
        id: 't-6',
        assignedClasses: ['8A', '8B'],
      },
      {
        key: 'accountant',
        userId: '4',
        id: 'UP-4',
        fullName: 'Vikram Shah',
        staff: { employeeId: 'E-0004', designation: 'Accountant', department: 'Finance' },
      },
      {
        key: 'rohan',
        userId: '5',
        // Aarav Sharma's father. The guardians table made his profile when it
        // seeded the guardians off the roster, so the seed names the number
        // rather than an id it cannot know. He is a parent at Vidya Mandir
        // too, on one login: the two-school family is the case the global
        // identity tables exist for, and it is asserted from both ends.
        guardianPhone: '9845123457',
      },
    ],
    roles: [
      { key: 'admin', roleId: 'admin' },
      { key: 'principal', roleId: 'principal' },
      { key: 'meera', roleId: 'teacher' },
      { key: 'meera', roleId: 'parent' },
      { key: 'accountant', roleId: 'accountant' },
      { key: 'rohan', roleId: 'parent' },
    ],
    typeCodes: [
      { key: 'admin', code: 'admin', isPrimary: true },
      { key: 'principal', code: 'staff', isPrimary: true },
      { key: 'meera', code: 'teacher', isPrimary: true },
      { key: 'meera', code: 'parent' },
      { key: 'accountant', code: 'staff', isPrimary: true },
      { key: 'rohan', code: 'parent', isPrimary: true },
    ],
    // Meera Iyengar is on the faculty list and on her own son's record as his
    // mother. One person, so one profile: the guardian row the guardians table
    // would otherwise mint for her becomes her teacher profile instead.
    staffGuardians: [{ phone: '9880114477', profileId: 't-6' }],
  },
}
