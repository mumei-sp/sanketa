/**
 * Users API Service
 *
 * Mock path (the in-browser user directory under `src/mocks/users`) + HTTP
 * path (apiClient). The directory owns the role each account holds and the
 * classes a scoped account may write to, exactly as a backend table would.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import * as mockServer from '@/mocks/users'
import type { SchoolUser } from '@/mocks/users'

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
 * Change what an account may do — its role, and the classes it may write to.
 *
 * @apiRoute PATCH /api/v1/users/{id}
 */
export async function updateUserAccess(
  id: string,
  patch: { roleId?: string; assignedClasses?: string[] },
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
