/**
 * Parents API Service
 *
 * Mock path (the in-browser parent directory under `src/mocks/parents`) + HTTP
 * path (apiClient). Two tables behind it — `parents` and `student_parents` —
 * both of which already exist in the backend schema, so these routes are the
 * shape it will expose rather than a guess.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import * as mockServer from '@/mocks/parents'
import type { Parent, StudentParent } from '@/mocks/parents'

export type { Parent, StudentParent }

/** A parent with the relationship they hold to one particular student. */
export type ParentOfStudent = Parent & { relationship: string; isPrimary: boolean }

/**
 * Everyone on file as a parent or guardian.
 *
 * @apiRoute GET /api/v1/parents
 */
export async function fetchParents(): Promise<Parent[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return mockServer.listParents()
    },
    async () => {
      const { data } = await apiClient.get<Parent[]>('/parents')
      return data
    },
  )
}

/**
 * Every link, for screens that need to count children per parent.
 *
 * @apiRoute GET /api/v1/student-parents
 */
export async function fetchParentLinks(): Promise<StudentParent[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 80, max: 200 })
      return mockServer.listLinks()
    },
    async () => {
      const { data } = await apiClient.get<StudentParent[]>('/student-parents')
      return data
    },
  )
}

/**
 * The parents of one student.
 *
 * @apiRoute GET /api/v1/students/{id}/parents
 */
export async function fetchParentsOfStudent(studentProfileId: string): Promise<ParentOfStudent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.parentsOfStudent(studentProfileId)
    },
    async () => {
      const { data } = await apiClient.get<ParentOfStudent[]>(
        `/students/${studentProfileId}/parents`,
      )
      return data
    },
  )
}

/**
 * The students one parent covers — what a parent account's scope is built of.
 *
 * @apiRoute GET /api/v1/parents/{id}/students
 */
export async function fetchStudentsOfParent(parentProfileId: string): Promise<string[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.studentsOfParent(parentProfileId)
    },
    async () => {
      const { data } = await apiClient.get<string[]>(`/parents/${parentProfileId}/students`)
      return data
    },
  )
}

/**
 * @apiRoute POST /api/v1/parents
 */
export async function createParent(input: {
  fullName: string
  email?: string | null
  phone?: string
}): Promise<Parent> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.createParent(input)
    },
    async () => {
      const { data } = await apiClient.post<Parent>('/parents', input)
      return data
    },
  )
}

/**
 * @apiRoute PATCH /api/v1/parents/{id}
 */
export async function updateParent(
  profileId: string,
  patch: { fullName?: string; email?: string | null; phone?: string },
): Promise<Parent | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.updateParent(profileId, patch)
    },
    async () => {
      const { data } = await apiClient.patch<Parent>(`/parents/${profileId}`, patch)
      return data
    },
  )
}

/**
 * Link a parent to a student. Idempotent on the pair.
 *
 * @apiRoute PUT /api/v1/students/{studentId}/parents/{parentId}
 */
export async function linkParent(input: {
  studentProfileId: string
  parentProfileId: string
  relationship: string
  isPrimary?: boolean
}): Promise<StudentParent | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.linkParent(input)
    },
    async () => {
      const { data } = await apiClient.put<StudentParent>(
        `/students/${input.studentProfileId}/parents/${input.parentProfileId}`,
        { relationship: input.relationship, isPrimary: input.isPrimary },
      )
      return data
    },
  )
}

/**
 * @apiRoute DELETE /api/v1/students/{studentId}/parents/{parentId}
 */
export async function unlinkParent(
  studentProfileId: string,
  parentProfileId: string,
): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.unlinkParent(studentProfileId, parentProfileId)
    },
    async () => {
      await apiClient.delete(`/students/${studentProfileId}/parents/${parentProfileId}`)
      return true
    },
  )
}
