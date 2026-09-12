/**
 * Roles API Service
 *
 * Mock path (the in-browser role table under `src/mocks/roles`) + HTTP path
 * (apiClient). The mock owns ids, seeding and persistence exactly as a backend
 * would, so flipping `VITE_USE_MOCK_API` changes which implementation runs and
 * nothing else.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { callerMay } from '@/mocks/_shared/caller'
import * as mockServer from '@/mocks/tenant/roles'
import type { Permission, Role, ScopeAxis } from '@/config/permissions'

/**
 * Every role the school has defined.
 *
 * ── Deliberately not guarded, and it must stay that way ────────────────
 * This is the ability's own input. `PermissionProvider` calls it on mount for
 * *every* signed-in account and resolves the caller's own roles out of what
 * comes back — so gating it on `roles.read` would hand a parent an empty
 * table, resolve them to no role, and deny them everything including the
 * screens they are entitled to. The guard would read as tightening security
 * and would in fact be an outage.
 *
 * What the table leaks is the shape of the school's permissions, not anybody's
 * data. The role *editor* is what needs a guard, and that is the write below.
 *
 * @apiRoute GET /api/v1/roles
 */
export async function fetchRoles(): Promise<Role[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return mockServer.listRoles()
    },
    async () => {
      const { data } = await apiClient.get<Role[]>('/roles')
      return data
    },
  )
}

/**
 * Whoever may define what a role can do may create, rename and remove one.
 *
 * `roles.manage` is unnarrowed, so the bare question is the whole question —
 * and nothing was asking it. This is the door every other guard in the app
 * stands behind: `updateRole('parent', { permissions: ALL_PERMISSIONS })` from
 * any signed-in session would have granted a family account everything, and
 * every check that reads the roles table would then have agreed.
 *
 * A throw rather than the `null` these functions already return, because null
 * here means a request the rules refuse on their own terms — a role narrowed
 * to `students`, an id already taken — and a refusal of *the caller* is a
 * different answer that a screen should not be able to confuse with it.
 */
function assertMayManageRoles(action: string): void {
  if (!callerMay('manage', 'Role')) {
    throw new Error(`Not allowed to ${action} a role.`)
  }
}

/**
 * Create a role.
 *
 * Null when the school asked for one narrowed to `students`. That axis is the
 * app's — a family role's scope comes from `student_guardians` and is not
 * something a school configures — so the two built-ins hold it and nothing
 * else may. See the note in the store.
 *
 * @apiRoute POST /api/v1/roles
 */
export async function createRole(input: {
  name: string
  description?: string
  permissions: Permission[]
  scopeBy?: ScopeAxis | 'none'
}): Promise<Role | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayManageRoles('create')
      return mockServer.createRole(input)
    },
    async () => {
      const { data } = await apiClient.post<Role>('/roles', input)
      return data
    },
  )
}

/**
 * @apiRoute PATCH /api/v1/roles/{id}
 */
export async function updateRole(
  id: string,
  patch: {
    name?: string
    description?: string
    permissions?: Permission[]
    scopeBy?: ScopeAxis | 'none'
  },
): Promise<Role | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayManageRoles('change')
      return mockServer.updateRole(id, patch)
    },
    async () => {
      const { data } = await apiClient.patch<Role>(`/roles/${id}`, patch)
      return data
    },
  )
}

/**
 * Put a deleted role back under its original id.
 *
 * A restore rather than a create, because the id is a foreign key every user
 * row holds — see the store. Resolves to null when the id is already taken.
 *
 * @apiRoute POST /api/v1/roles/{id}/restore
 */
export async function restoreRole(role: Role): Promise<Role | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayManageRoles('restore')
      return mockServer.restoreRole(role)
    },
    async () => {
      const { data } = await apiClient.post<Role>(`/roles/${role.id}/restore`, role)
      return data
    },
  )
}

/**
 * Built-in roles refuse deletion — see the store for why.
 *
 * @apiRoute DELETE /api/v1/roles/{id}
 */
export async function deleteRole(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      assertMayManageRoles('delete')
      return mockServer.deleteRole(id)
    },
    async () => {
      await apiClient.delete(`/roles/${id}`)
      return true
    },
  )
}
