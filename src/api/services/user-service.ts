/**
 * Users API Service
 *
 * Mock path (the global user directory under `src/mocks/global/users`) + HTTP
 * path (apiClient).
 *
 * The directory owns *identity* — what somebody signs in with, and whether
 * they may. What they are allowed to do belongs to the school they are doing
 * it at, so it lives in that school's `profile_roles`. `fetchPeople` joins
 * the two, which is the read every administration screen actually wants.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import * as mockServer from '@/mocks/global/users'
import { addMembership, activeTenantCode } from '@/mocks/global'
import {
  setDesignation,
  attachLogin,
  capacitiesOf,
  createProfile,
  deleteProfile,
  detachLogin,
  grantRole,
  roleGrantsOf,
  listDesignations,
  listProfiles,
  profileOf,
  resolveTenantAccess,
  revokeRole,
  updateProfile,
} from '@/mocks/tenant/profiles'
import { authUtils } from '@/api/utils/auth'
import { callerMay } from '@/mocks/_shared/caller'
import type { SchoolUser } from '@/mocks/global/users'
import type { Capacity } from '@/mocks/tenant/profiles'
import type { AccountStatus } from '@/features/auth/types'

export type { SchoolUser }

// ---------------------------------------------------------------------------
// Who may change who somebody is
// ---------------------------------------------------------------------------

/**
 * The three acts this file performs, and the permission each one is.
 *
 * None of them were asked for. Between them these functions decide who exists
 * at a school, what they are there, and which role they hold — so an unguarded
 * `setPersonRole(myProfileId, 'admin', true)` was a complete bypass of every
 * other check in the app, reachable from any signed-in session. The roles
 * editor is the other half of that door; see `role-service`.
 *
 * All three permissions are unnarrowed, so the bare question is the whole
 * question — there is no record here to test a condition against, which is the
 * case `callerMay` is documented for.
 *
 * ── Why adding and removing are one permission ─────────────────────────
 * `users.create` covers the undos as well as the acts: `deleteUser` exists to
 * take back a `createUser` and `removeProfileHere` to take back an
 * `enrolPersonHere`, both of them reached from the same undo toast. Splitting
 * them would let an administrator add somebody they could not then remove,
 * which is not a state the screen can express and not one a school would ask
 * for. The catalogue has no `users.delete` for that reason.
 */
function assertMayAddPeople(what: string): void {
  if (!callerMay('create', 'User')) {
    throw new Error(`Not allowed to ${what}.`)
  }
}

/** `users.update` — the classes somebody covers, and whether they may sign in. */
function assertMayEditAccess(what: string): void {
  if (!callerMay('update', 'User')) {
    throw new Error(`Not allowed to ${what}.`)
  }
}

/**
 * `roles.assign` — which role somebody holds.
 *
 * Its own permission, and deliberately not `users.update`: deciding that a
 * teacher covers 8B as well as 8A is an administrative nicety, and deciding
 * that she is the Principal is not. A school that delegates the first does not
 * thereby delegate the second.
 */
function assertMayAssignRoles(what: string): void {
  if (!callerMay('assign', 'User')) {
    throw new Error(`Not allowed to ${what}.`)
  }
}

/**
 * Everyone with an account.
 *
 * @apiRoute GET /api/v1/users
 */
export async function fetchUsers(): Promise<SchoolUser[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      // Every login at the school, with the address each one signs in on.
      if (!callerMay('read', 'User')) return []
      return mockServer.listUsers()
    },
    async () => {
      const { data } = await apiClient.get<SchoolUser[]>('/users')
      return data
    },
  )
}

/**
 * Everyone with an account, joined to what they are at *this* school.
 *
 * The read the People screen wants, and the reason it is one call: a person's
 * name and whether they can sign in are global, and their roles and classes
 * belong to the school in front of you. Two reads would mean two loading
 * states for one row.
 *
 * Somebody with a membership and no profile here appears with no roles. That
 * is a real state — enrolled at a second school before anyone decided what
 * they do there — and hiding them would hide the person an administrator has
 * to give a role to.
 *
 * @apiRoute GET /api/v1/users?expand=profile
 */
export interface Person {
  user: SchoolUser
  /** Their profile id at this school, or null if they have none here. */
  profileId: string | null
  /** Every role held here. Plural: somebody can teach and be a parent. */
  roleIds: string[]
  /** Class sections they may write to here. */
  assignedClasses: string[]
  /** Which records they have here — teacher, parent, staff, student. */
  capacities: string[]
  /**
   * Each role held, with how it got there — who granted it and when it ends.
   *
   * On the person rather than fetched per row: a People screen shows every
   * grant at once, and asking once per person would be a round trip per card
   * for something the same query already has in hand.
   */
  grants: RoleGrant[]
}

export async function fetchPeople(): Promise<Person[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 120, max: 280 })
      // And the same list joined to roles, classes and who granted them.
      if (!callerMay('read', 'User')) return []
      return mockServer.listUsers().map(user => {
        const access = resolveTenantAccess(user.id)
        return {
          user,
          profileId: access.profileId,
          roleIds: access.roleIds,
          assignedClasses: access.assignedClasses,
          capacities: access.capacities,
          grants: access.profileId ? grantsWithNames(access.profileId) : [],
        }
      })
    },
    async () => {
      const { data } = await apiClient.get<Person[]>('/users', { params: { expand: 'profile' } })
      return data
    },
  )
}

/**
 * Make somebody who already has an account into somebody *here*.
 *
 * The act the People screen was missing. A person can hold a login and be
 * nobody at a school — enrolled at a second one before anyone decided what
 * they do there — and until now the screen could name that state and not
 * resolve it.
 *
 * Three writes again, for the same reason `createUser` makes three: the
 * membership so they can be routed here, the profile so they are somebody
 * here, and the kind so the profile has a shape. Roles come after, one chip at
 * a time — deliberately, because deciding somebody works here and deciding
 * what they may do are two decisions and an administrator may want a moment
 * between them.
 *
 * @apiRoute POST /api/v1/tenants/{tenantCode}/profiles
 */
export async function enrolPersonHere(
  userId: string,
  capacity: Capacity,
): Promise<string | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAddPeople('enrol somebody at this school')
      if (profileOf(userId)) return null

      // Idempotent, so somebody already routable here is not disturbed.
      addMembership({ userId, tenantCode: activeTenantCode() })

      // A capacity, not a "profile type". The question this answers is
      // structural — which table carries their record — and it used to be
      // asked as a school-defined label that named a capacity indirectly. The
      // label is now a job title on the employment record, which only staff
      // have, and is set separately.
      //
      // Staff get their employment record here because nothing else would
      // create one. Students, teachers and guardians are enrolled through
      // their own screens, which own those tables.
      const profile = createProfile(
        {
          userId,
          fullName: mockServer.listUsers().find(row => row.id === userId)?.fullName ?? userId,
        },
        capacity === 'staff' ? { employeeId: `E-${userId}` } : undefined,
      )
      return profile.id
    },
    async () => {
      const { data } = await apiClient.post<{ profileId: string }>(
        `/tenants/${activeTenantCode()}/profiles`,
        { userId, capacity },
      )
      return data.profileId
    },
  )
}

/**
 * Take that back — remove somebody's profile at this school.
 *
 * Their roles go with it. The login survives, and so does every other school
 * they belong to.
 *
 * @apiRoute DELETE /api/v1/tenants/{tenantCode}/profiles/{profileId}
 */
export async function removeProfileHere(profileId: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAddPeople('remove somebody from this school')
      // A person the school's own tables know — a parent, a teacher — keeps
      // their row and loses their login; deleting the profile would take the
      // person off the roster. Only a profile that exists solely because
      // somebody was given an account here is removed outright.
      return capacitiesOf(profileId).length > 0
        ? detachLogin(profileId)
        : deleteProfile(profileId)
    },
    async () => {
      await apiClient.delete(`/tenants/${activeTenantCode()}/profiles/${profileId}`)
      return true
    },
  )
}

/**
 * Give somebody a role at this school, or take it away.
 *
 * Two calls rather than "set their roles to this list", because that is what
 * the table is — a row per (profile, role) — and because an administrator
 * toggling one chip should send one change, not a whole list that could
 * silently drop a role somebody else granted a moment ago.
 *
 * @apiRoute PUT / DELETE /api/v1/profiles/{profileId}/roles/{roleId}
 */
export async function setPersonRole(
  profileId: string,
  roleId: string,
  held: boolean,
  options: {
    /**
     * ISO date the role lapses on. Absent means permanent — and passing it
     * absent on a role that had one is how an expiry is lifted.
     */
    expiresAt?: string
    /**
     * Why, in the granter's words. Optional, and replaced rather than merged —
     * re-granting a role is a new decision, so the old reason goes with the
     * old terms.
     */
    reason?: string
  } = {},
): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAssignRoles(held ? 'give somebody a role' : 'take a role away')
      if (held) {
        grantRole(profileId, roleId, {
          expiresAt: options.expiresAt,
          reason: options.reason,
          assignedBy: granterId(),
        })
      } else revokeRole(profileId, roleId)
      return true
    },
    async () => {
      if (held) {
        await apiClient.put(`/profiles/${profileId}/roles/${roleId}`, {
          expiresAt: options.expiresAt ?? null,
          reason: options.reason ?? null,
        })
      } else {
        await apiClient.delete(`/profiles/${profileId}/roles/${roleId}`)
      }
      return true
    },
  )
}

/**
 * The class sections somebody may write to at this school.
 *
 * `teacher_classes`, and per school for the reason that table is: `8A` at one
 * school is a different eight children from `8A` at another.
 *
 * @apiRoute PUT /api/v1/profiles/{profileId}/classes
 */
export async function setPersonClasses(
  profileId: string,
  classSections: string[],
): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayEditAccess('change which classes somebody covers')
      return updateProfile(profileId, { assignedClasses: [...classSections] }) !== null
    },
    async () => {
      await apiClient.put(`/profiles/${profileId}/classes`, { classSections })
      return true
    },
  )
}

/**
 * Which identifier is already claimed, if either.
 *
 * A separate call rather than a richer return from `createUser`, because a
 * screen wants to ask *before* it submits as well as after it fails — the
 * provisioning list wants to mark a row as blocked without trying to create
 * it. A backend would answer this from the same unique indexes the insert
 * relies on.
 *
 * @apiRoute GET /api/v1/users/identifier-check
 */
export async function identifierTaken(input: {
  email?: string | null
  phone?: string
  exceptId?: string
}): Promise<'email' | 'phone' | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 40, max: 120 })
      assertMayAddPeople('check whether an email or number is already in use')
      return mockServer.claimedIdentifier(input)
    },
    async () => {
      const { data } = await apiClient.get<{ taken: 'email' | 'phone' | null }>(
        '/users/identifier-check',
        { params: input },
      )
      return data.taken
    },
  )
}

/**
 * Who is doing the granting, as a profile id at this school.
 *
 * Read from the session rather than taken as an argument, for the reason
 * `_shared/caller.ts` gives at length: a client that names its own actor can
 * name somebody else. Undefined when nobody is signed in, which is the seed
 * and the tests.
 */
function granterId(): string | undefined {
  const session = authUtils.getUser()
  return session ? profileOf(session.id)?.id : undefined
}

/**
 * The roles one person holds here, each with when it was granted, by whom and
 * when it lapses.
 *
 * `Person.roleIds` answers what they may do. This answers where it came from,
 * which is the question a People screen is actually asked.
 *
 * @apiRoute GET /api/v1/profiles/{profileId}/roles
 */
export async function fetchRoleGrants(profileId: string): Promise<RoleGrant[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      if (!callerMay('read', 'User')) return []
      return grantsWithNames(profileId)
    },
    async () => {
      const { data } = await apiClient.get<RoleGrant[]>(`/profiles/${profileId}/roles`)
      return data
    },
  )
}

/** A role somebody holds, and how it got there. */
export interface RoleGrant {
  roleId: string
  assignedAt: string
  /** Absent means permanent. */
  expiresAt?: string
  /** Null when nobody can be named — the seed grants have no author. */
  grantedBy: string | null
  /** Why it was given, if whoever gave it said. `profile_roles.notes`. */
  reason?: string
}

/** The grants on one profile, with the granter resolved to a name. */
function grantsWithNames(profileId: string): RoleGrant[] {
  return roleGrantsOf(profileId).map(grant => ({
    roleId: grant.roleId,
    assignedAt: grant.assignedAt,
    expiresAt: grant.expiresAt,
    grantedBy: grant.assignedBy ? (profileNameOf(grant.assignedBy) ?? null) : null,
    reason: grant.reason,
  }))
}

/** A granter's name, for display. Null rather than an id nobody can read. */
function profileNameOf(profileId: string): string | null {
  return listProfiles().find(row => row.id === profileId)?.fullName ?? null
}

/**
 * Add an account.
 *
 * Resolves to null when there is nothing to sign in with, or when either
 * identifier is already taken — ask `identifierTaken` which.
 *
 * @apiRoute POST /api/v1/users
 */
export async function createUser(input: {
  fullName: string
  email?: string | null
  phone?: string
  roleId: string
  teacherId?: string
  /**
   * Which record this person gets here. Defaults to `staff`.
   *
   * Structural, and a closed set — a capacity is a table. What a school calls
   * them is `designationId` below, which is open and only staff have one.
   */
  capacity?: Capacity
  /** → `staff_designations.id`. Staff only, and optional even then. */
  designationId?: string
  status?: AccountStatus
  studentId?: string
  guardianId?: string
  assignedClasses?: string[]
}): Promise<SchoolUser | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAddPeople('add an account')
      // An account is created holding a role, so the grant is part of the act
      // and has to clear the same bar a grant made afterwards would.
      assertMayAssignRoles('give somebody a role')

      // Checked before anything is written: an unknown title would otherwise
      // create a login and a membership and then fail to record what the
      // person is employed as.
      const capacity: Capacity = input.capacity ?? 'staff'
      if (
        input.designationId !== undefined &&
        !listDesignations().some(row => row.id === input.designationId)
      ) {
        return null
      }

      const user = mockServer.createUser(input)
      if (!user) return null

      // Three writes, one act. A global login is no use on its own: without a
      // membership the person cannot be routed to a school and sign-in refuses
      // them, and without a profile they arrive as nobody with no roles. The
      // backend does all three in the transaction that answers this route —
      // see SCHEMA-FIXES, which notes that no such write path exists there yet.
      addMembership({ userId: user.id, tenantCode: activeTenantCode() })

      // If the account belongs to somebody the school already has a record
      // for — a parent being given a login, say — the login hangs on *their*
      // profile rather than creating a second one for the same human. That is
      // the whole reason a profile is one row per person and not one per
      // account.
      const existing = input.guardianId ?? input.studentId
      const profile = existing
        ? (attachLogin(existing, user.id) ??
          createProfile({ userId: user.id, fullName: user.fullName }))
        : createProfile(
            {
              userId: user.id,
              fullName: user.fullName,
              assignedClasses: input.assignedClasses,
            },
            capacity === 'staff'
              ? { employeeId: `E-${user.id}`, designationId: input.designationId }
              : undefined,
          )
      if (input.assignedClasses && existing) {
        updateProfile(profile.id, { assignedClasses: input.assignedClasses })
      }
      grantRole(profile.id, input.roleId)
      if (capacity === 'staff' && input.designationId) {
        setDesignation(profile.id, input.designationId)
      }

      return user
    },
    async () => {
      const { data } = await apiClient.post<SchoolUser>('/users', input)
      return data
    },
  )
}



/**
 * Change what an account may do — its role, and the classes it may write to.
 *
 * @apiRoute PATCH /api/v1/users/{id}
 */
export async function updateUserAccess(
  id: string,
  patch: { roleId?: string; assignedClasses?: string[]; status?: AccountStatus },
): Promise<SchoolUser | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayEditAccess('change what an account may do')
      // A role inside an access patch is still a role change.
      if (patch.roleId !== undefined) assertMayAssignRoles('give somebody a role')
      return mockServer.updateUser(id, patch)
    },
    async () => {
      const { data } = await apiClient.patch<SchoolUser>(`/users/${id}`, patch)
      return data
    },
  )
}

/**
 * Remove an account.
 *
 * Only reached by undoing the creation of one. Whether the removal would leave
 * nobody able to manage settings is checked by the caller, which is the layer
 * that can see the roles.
 *
 * @apiRoute DELETE /api/v1/users/{id}
 */
export async function deleteUser(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAddPeople('remove an account')
      return mockServer.deleteUser(id)
    },
    async () => {
      await apiClient.delete(`/users/${id}`)
      return true
    },
  )
}

/**
 * Put a removed account back under its original id.
 *
 * @apiRoute POST /api/v1/users/{id}/restore
 */
export async function restoreUser(user: SchoolUser): Promise<SchoolUser | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayAddPeople('restore an account')
      return mockServer.restoreUser(user)
    },
    async () => {
      const { data } = await apiClient.post<SchoolUser>(`/users/${user.id}/restore`, user)
      return data
    },
  )
}
