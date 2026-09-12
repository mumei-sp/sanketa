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

import { profileOf, roleIdsOf, designationOf } from './store'
import { capacitiesOf } from './capacities'
import { findStudent } from '@/mocks/tenant/students/store'
import { studentsOfGuardian } from '@/mocks/tenant/guardians/store'
import { listRoles } from '@/mocks/tenant/roles/store'
import { activeSide } from '@/mocks/_shared/active-context'
import { CONTEXT_SIDES, sideOfRole, type ContextSide } from '@/config/permissions'
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
  /** Their job title here, if they are staff. Display only. */
  designation: string | null
  /** `teacher_classes` — the class axis. Empty for anyone not class-scoped. */
  assignedClasses: string[]
  /** The student axis: their own record, or their children's, at this school. */
  studentIds: string[]
}

const EMPTY: TenantAccess = {
  profileId: null,
  roleIds: [],
  capacities: [],
  designation: null,
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
    designation: designationOf(profile.id)?.name ?? null,
    assignedClasses: profile.assignedClasses ?? [],
    // Deduplicated: a person who is both a student and their sibling's
    // guardian would otherwise name the same child twice.
    studentIds: [...new Set(studentIds)],
  }
}

// ── Sides ─────────────────────────────────────────────────────────────

/**
 * Which record shapes belong to which side.
 *
 * `none` appears in neither: a classification with no record of its own — an
 * emergency contact, a visiting examiner — is not a way of using the app, and
 * a person whose only capacity is `none` holds no side and reaches nothing.
 */
const SIDE_CAPACITIES: Record<ContextSide, readonly Capacity[]> = {
  staff: ['teacher', 'staff'],
  family: ['student', 'guardian'],
}

/**
 * The sides this person can actually act in at this school, in offering order.
 *
 * Read off the roles, not the capacities. Having a `guardians` row makes
 * somebody a parent here; holding a role whose axis is `students` is what
 * gives them something to *do* about it. A profile with a capacity and no
 * matching role is the "enrolled, but nobody has said what you do yet" state,
 * and it must not present itself as a usable side.
 */
export function sidesAvailable(access: TenantAccess): ContextSide[] {
  const table = listRoles()
  const held = new Set(
    access.roleIds.flatMap(id => {
      const role = table.find(candidate => candidate.id === id)
      return role ? [sideOfRole(role)] : []
    }),
  )
  return CONTEXT_SIDES.filter(side => held.has(side))
}

/**
 * The same access, as one side of it.
 *
 * Everything that says *what this session may do* is filtered; everything that
 * says *who this person is* is left alone. So `profileId` and `designation`
 * survive — she is still the same person, and still classified a teacher and a
 * parent — while the roles, the capacities and both scope axes are reduced to
 * the half being acted in.
 *
 * Zeroing the far axis is belt as well as braces: `defineAbilityFor` only
 * consults an axis some held role declares, so dropping the roles would be
 * enough for the ability. It matters for everything that reads the scope
 * directly — the child switcher asks `studentIds` — where a populated list on
 * the staff side would offer somebody their own child from behind their desk.
 */
export function narrowToSide(access: TenantAccess, side: ContextSide): TenantAccess {
  const table = listRoles()
  const allowed = SIDE_CAPACITIES[side]

  return {
    ...access,
    roleIds: access.roleIds.filter(id => {
      const role = table.find(candidate => candidate.id === id)
      // A role the school has since deleted narrows to nothing on either side.
      return role !== undefined && sideOfRole(role) === side
    }),
    capacities: access.capacities.filter(capacity => allowed.includes(capacity)),
    assignedClasses: side === 'staff' ? access.assignedClasses : [],
    studentIds: side === 'family' ? access.studentIds : [],
  }
}

/**
 * What this session may do — the read almost everything should use.
 *
 * `resolveTenantAccess` above is the whole truth about a person at a school,
 * and stays that way because the chooser has to enumerate what they *could*
 * be. This is the truth about the session in front of you, which is a strictly
 * smaller thing, and the difference is the entire point: the principal whose
 * child attends must not carry a principal's permissions into her son's
 * record.
 *
 * ── What happens when nothing has been chosen ──────────────────────────
 * It narrows anyway, to the first side available. Never to the union.
 *
 * Returning the union for an unchosen session would be a fail-open of exactly
 * the shape `caller.ts` warns about — and it is reachable, because the guard
 * that sends a multi-context person to the chooser is a router decision and
 * this is not. Somebody with one side is unaffected, which is almost everyone;
 * somebody with two gets the staff half for the instant before the redirect
 * lands, which is the conservative half to be wrong with.
 *
 * A stored side that no longer resolves — a role revoked since it was picked —
 * narrows to nothing rather than falling back. An empty app is the honest
 * answer to "act as something you no longer are", and `useContexts` clears the
 * stale choice and asks again.
 */
export function resolveActiveAccess(userId: string | undefined): TenantAccess {
  const access = resolveTenantAccess(userId)
  const available = sidesAvailable(access)
  if (available.length === 0) return access

  const chosen = activeSide()
  return narrowToSide(access, chosen ?? available[0])
}
