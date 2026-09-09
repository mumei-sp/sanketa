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
  profileType?: ProfileType
  status?: AccountStatus
  studentId?: string
  parentId?: string
  assignedClasses?: string[]
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
