/**
 * The active school's faculty.
 *
 * ── Why this file is four lines now ────────────────────────────────────
 * It used to be the faculty: eighteen literal rows, exported as a module
 * constant and imported by six modules. Which made it one staff room for both
 * schools — Priya Nair, `T-1002`, taught 9A Social Studies in Room 901 at
 * Kendriya and at Vidya Mandir, in the same period on the same day. The
 * timetable, the signature on a register, the name on a mark sheet, the
 * workload chart and every teacher's detail page were all built on it, so all
 * of them crossed the boundary that the roster, the fees and the marks
 * respected.
 *
 * A faculty is a fact about a school, so the rows moved into the schools'
 * folders and this resolves the active one — the same shape as
 * `mocks/tenant/students/store.ts` seeding from `tenantFixtures().students`.
 *
 * ── Why a constant and not a function ─────────────────────────────────
 * Read once at module load, like the other tenant-resolved fixtures, because
 * switching school reloads the page. Six consumers import the value; making it
 * a call would change all six for no gain while the switch is a navigation.
 */

import type { Teacher } from '@/features/teachers/types'
import { tenantFixtures } from '@/mocks/schools'
import { splitPerson, personOf, staffOf } from '@/mocks/tenant/profiles/store'

/**
 * Faculty rows, joined to the two tables a teacher extends.
 *
 * `user_profiles` owns who she is — name, date of birth, the number she
 * answers. `staff` owns how she is employed — the employee number, the
 * department. `teachers` owns only what is true of teaching. The fixture is
 * authored as one whole person, because that is the readable way to write a
 * seed, and split on the way in.
 *
 * Which looks like a no-op over a fixture and is not: rename her on the People
 * screen and the profile is what changed; her employee number is a `staff`
 * column, so `teacherId` reads it back rather than keeping a second copy that
 * could drift.
 */
export const teachersData: Teacher[] = tenantFixtures().teachers.map(teacher => {
  const id = String(teacher.id)
  return {
    ...personOf(id),
    ...splitPerson(teacher).row,
    teacherId: staffOf(id)?.employeeId ?? teacher.teacherId,
  } as Teacher
})

/**
 * One teacher by their profile id — `user_profiles.id` at this school.
 *
 * `Teacher.id` *is* the profile id: under the schema, `teachers` takes
 * `profile_id` as its own primary key, so the two are one id and not a
 * pointer from one to the other.
 */
export function findTeacher(profileId: string): Teacher | undefined {
  return teachersData.find(teacher => String(teacher.id) === profileId)
}
