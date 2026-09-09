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
  assignProfileType,
  createProfile,
  grantRole,
  resolveTenantAccess,
  revokeRole,
  updateProfile,
} from '@/mocks/profiles'
import type { SchoolUser } from '@/mocks/global/users'
import type { AccountStatus, ProfileType } from '@/features/auth/types'

export type { SchoolUser }

/**
 * Everyone with an account.
 *
 * @apiRoute GET /api/v1/users
 */
export async function fetchUsers(): Promise<SchoolUser[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
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
}

export async function fetchPeople(): Promise<Person[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 120, max: 280 })
      return mockServer.listUsers().map(user => {
        const access = resolveTenantAccess(user.id)
        return {
          user,
          profileId: access.profileId,
          roleIds: access.roleIds,
          assignedClasses: access.assignedClasses,
          capacities: access.capacities,
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
): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      if (held) grantRole(profileId, roleId)
      else revokeRole(profileId, roleId)
      return true
    },
    async () => {
      if (held) await apiClient.put(`/profiles/${profileId}/roles/${roleId}`)
      else await apiClient.delete(`/profiles/${profileId}/roles/${roleId}`)
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
  profileType?: ProfileType
  status?: AccountStatus
  studentId?: string
  parentId?: string
  assignedClasses?: string[]
}): Promise<SchoolUser | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const user = mockServer.createUser(input)
      if (!user) return null

      // Three writes, one act. A global login is no use on its own: without a
      // membership the person cannot be routed to a school and sign-in refuses
      // them, and without a profile they arrive as nobody with no roles. The
      // backend does all three in the transaction that answers this route —
      // see SCHEMA-FIXES, which notes that no such write path exists there yet.
      addMembership({ userId: user.id, tenantCode: activeTenantCode() })

      const profile = createProfile({
        userId: user.id,
        studentId: input.studentId,
        parentId: input.parentId,
        teacherId: input.teacherId,
        // Staff get an employee number from their login id, which is what a
        // school with no HR system would do anyway.
        staffId: isStaffKind(input.profileType) ? `E-${user.id}` : undefined,
        assignedClasses: input.assignedClasses,
      })
      grantRole(profile.id, input.roleId)
      // Built-in type ids are `PT-<code>`, and the codes are the profile-type
      // names, so this needs no lookup.
      assignProfileType(profile.id, `PT-${input.profileType ?? 'staff'}`, true)

      return user
    },
    async () => {
      const { data } = await apiClient.post<SchoolUser>('/users', input)
      return data
    },
  )
}

/** Kinds whose record is an employment record rather than a family one. */
function isStaffKind(profileType?: ProfileType): boolean {
  return profileType === undefined || profileType === 'staff' || profileType === 'admin'
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
      return mockServer.restoreUser(user)
    },
    async () => {
      const { data } = await apiClient.post<SchoolUser>(`/users/${user.id}/restore`, user)
      return data
    },
  )
}
