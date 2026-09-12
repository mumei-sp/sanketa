/**
 * What one login may do at the school it is currently looking at.
 *
 * The read that replaces four fields on the global user row. `roleId`,
 * `profileType`, `assignedClasses` and the capacity pointers all described a
 * person *at a school*, and lived on a row that has one of each — so a teacher
 * at one school and a parent at another had one answer for two questions, and
 * a teacher whose child attends the same school had one answer for two roles.
 *
 * Resolved per call rather than stamped at sign-in, because the answer changes
 * with the active school. Fabric does the same: the token says which schools,
 * the server resolves what-you-are-here from the active one on each request.
 */

import { profileOf, roleIdsOf, typesOf } from './store'
import { capacitiesOf } from './capacities'
import { findStudent } from '@/mocks/tenant/students/store'
import { studentsOfGuardian } from '@/mocks/tenant/guardians/store'
import type { Capacity } from './store'

export interface TenantAccess {
  /** The profile id at this school, or null when they are not here at all. */
  profileId: string | null
  /**
   * Every role held here.
   *
   * Plural. The permissions somebody gets are the union of these, each
   * narrowed on its own axis — which is how a teacher who is also a parent
   * reads her own classes *and* her own child.
   */
  roleIds: string[]
  /** Which record shapes they have here — which capacity tables hold them. */
  capacities: Capacity[]
  /** Their classifications, primary first. Display and filtering only. */
  typeCodes: string[]
  /** `teacher_classes` — the class axis. Empty for anyone not class-scoped. */
  assignedClasses: string[]
  /** The student axis: their own record, or their children's, at this school. */
  studentIds: string[]
}

const EMPTY: TenantAccess = {
  profileId: null,
  roleIds: [],
  capacities: [],
  typeCodes: [],
  assignedClasses: [],
  studentIds: [],
}

/**
 * Resolve a login's access at the active school.
 *
 * Returns nothing at all — no roles, no scope — for a login with no profile
 * here. That is the safe answer and the true one: a membership says they may
 * *reach* this school, and a profile says they are actually somebody in it.
 * Being able to knock is not being expected.
 */
export function resolveTenantAccess(userId: string | undefined): TenantAccess {
  if (!userId) return EMPTY
  const profile = profileOf(userId)
  if (!profile) return EMPTY

  // Asked of the capacity tables, not read off pointer columns. A capacity is
  // having a row whose primary key is this profile, so that is the question.
  const capacities = capacitiesOf(profile.id)

  // Their own record if they are a student here, their children's if they are
  // a guardian here, and both if somehow both. Both keyed on the profile id,
  // which is the whole point of the profile being the id: `student_guardians`
  // links profile to profile.
  const studentIds = [
    ...(capacities.includes('student') && findStudent(profile.id) ? [profile.id] : []),
    ...(capacities.includes('guardian') ? studentsOfGuardian(profile.id) : []),
  ]

  return {
    profileId: profile.id,
    roleIds: roleIdsOf(profile.id),
    capacities,
    typeCodes: typesOf(profile.id).map(type => type.code),
    assignedClasses: profile.assignedClasses ?? [],
    // Deduplicated: a person who is both a student and their sibling's
    // guardian would otherwise name the same child twice.
    studentIds: [...new Set(studentIds)],
  }
}
