/**
 * Guardians API Service
 *
 * Mock path (the in-browser parent directory under `src/mocks/tenant/guardians`) + HTTP
 * path (apiClient). Two tables behind it — `parents` and `student_parents` —
 * both of which already exist in the backend schema, so these routes are the
 * shape it will expose rather than a guess.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import * as mockServer from '@/mocks/tenant/guardians'
import type { Guardian, StudentGuardian } from '@/mocks/tenant/guardians'

export type { Guardian, StudentGuardian }

/** A parent with the relationship they hold to one particular student. */
export type GuardianOfStudent = Guardian & { relationship: string; isPrimary: boolean }

/**
 * Everyone on file as a parent or guardian.
 *
 * @apiRoute GET /api/v1/parents
 */
export async function fetchGuardians(): Promise<Guardian[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return mockServer.listGuardians()
    },
    async () => {
      const { data } = await apiClient.get<Guardian[]>('/guardians')
      return data
    },
  )
}

/**
 * Every link, for screens that need to count children per parent.
 *
 * @apiRoute GET /api/v1/student-parents
 */
export async function fetchGuardianLinks(): Promise<StudentGuardian[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 80, max: 200 })
      return mockServer.listLinks()
    },
    async () => {
      const { data } = await apiClient.get<StudentGuardian[]>('/student-guardians')
      return data
    },
  )
}

/**
 * The parents of one student.
 *
 * @apiRoute GET /api/v1/students/{id}/parents
 */
export async function fetchGuardiansOfStudent(studentProfileId: string): Promise<GuardianOfStudent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.guardiansOfStudent(studentProfileId)
    },
    async () => {
      const { data } = await apiClient.get<GuardianOfStudent[]>(
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
export async function fetchStudentsOfGuardian(guardianProfileId: string): Promise<string[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.studentsOfGuardian(guardianProfileId)
    },
    async () => {
      const { data } = await apiClient.get<string[]>(`/guardians/${guardianProfileId}/students`)
      return data
    },
  )
}

/**
 * @apiRoute POST /api/v1/parents
 */
export async function createGuardian(input: {
  fullName: string
  email?: string | null
  phone?: string
}): Promise<Guardian> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.createGuardian(input)
    },
    async () => {
      const { data } = await apiClient.post<Guardian>('/guardians', input)
      return data
    },
  )
}

/**
 * @apiRoute PATCH /api/v1/parents/{id}
 */
export async function updateGuardian(
  profileId: string,
  patch: { fullName?: string; email?: string | null; phone?: string },
): Promise<Guardian | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.updateGuardian(profileId, patch)
    },
    async () => {
      const { data } = await apiClient.patch<Guardian>(`/guardians/${profileId}`, patch)
      return data
    },
  )
}

/**
 * Link a parent to a student. Idempotent on the pair.
 *
 * @apiRoute PUT /api/v1/students/{studentId}/guardians/{guardianId}
 */
export async function linkGuardian(input: {
  studentProfileId: string
  guardianProfileId: string
  relationship: string
  isPrimary?: boolean
}): Promise<StudentGuardian | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.linkGuardian(input)
    },
    async () => {
      const { data } = await apiClient.put<StudentGuardian>(
        `/students/${input.studentProfileId}/guardians/${input.guardianProfileId}`,
        { relationship: input.relationship, isPrimary: input.isPrimary },
      )
      return data
    },
  )
}

/**
 * @apiRoute DELETE /api/v1/students/{studentId}/guardians/{guardianId}
 */
export async function unlinkGuardian(
  studentProfileId: string,
  guardianProfileId: string,
): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.unlinkGuardian(studentProfileId, guardianProfileId)
    },
    async () => {
      await apiClient.delete(`/students/${studentProfileId}/guardians/${guardianProfileId}`)
      return true
    },
  )
}
