/**
 * What records a person has at this school.
 *
 * Asked of the capacity tables rather than read off a column, because that is
 * what a capacity is: `students`, `teachers`, `guardians` and `staff` all take
 * `profile_id` as their primary key, so having one is having a row. Plural,
 * and that is the point — the teacher whose child attends comes back
 * `['teacher', 'guardian']`, which is what a single `profile_type` could never
 * say.
 *
 * ── Why it is not in `store.ts` ────────────────────────────────────────
 * Because the arrow turned round. The capacity tables read their person
 * columns from `user_profiles` now, so the profiles store cannot import them —
 * it would be importing modules that are waiting on it. Asking four tables
 * whether a row exists is a join, not part of the table, so it lives beside
 * the store and imports both sides.
 */

import type { Capacity } from './store'
import { staffOf } from './store'
import { findStudent } from '@/mocks/tenant/students/store'
import { findTeacher } from '@/mocks/tenant/teachers/teachers'
import { findGuardian } from '@/mocks/tenant/guardians/store'

export function capacitiesOf(profileId: string): Capacity[] {
  const out: Capacity[] = []
  if (findStudent(profileId)) out.push('student')
  if (findTeacher(profileId)) out.push('teacher')
  if (staffOf(profileId)) out.push('staff')
  if (findGuardian(profileId)) out.push('guardian')
  return out
}
