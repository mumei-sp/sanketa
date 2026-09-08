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
 * Add an account.
 *
 * Resolves to null when the email is already taken.
 *
 * @apiRoute POST /api/v1/users
 */
export async function createUser(input: {
  fullName: string
  email: string
  roleId: string
}): Promise<SchoolUser | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.createUser(input)
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
