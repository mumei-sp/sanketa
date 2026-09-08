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
import * as mockServer from '@/mocks/roles'
import type { Permission, Role } from '@/config/permissions'

/**
 * Every role the school has defined.
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
 * @apiRoute POST /api/v1/roles
 */
export async function createRole(input: {
  name: string
  description?: string
  permissions: Permission[]
}): Promise<Role> {
  return mockOrHttp(
    async () => {
      await withLatency()
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
    scopedToAssignedClasses?: boolean
  },
): Promise<Role | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.updateRole(id, patch)
    },
    async () => {
      const { data } = await apiClient.patch<Role>(`/roles/${id}`, patch)
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
      return mockServer.deleteRole(id)
    },
    async () => {
      await apiClient.delete(`/roles/${id}`)
      return true
    },
  )
}
