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
import { callerSeesEveryRow, visibleToCaller, visibleRecordToCaller } from '@/mocks/_shared/caller'
import { findStudent } from '@/mocks/tenant/students/store'
import type { Guardian, StudentGuardian } from '@/mocks/tenant/guardians'

export type { Guardian, StudentGuardian }

/** A parent with the relationship they hold to one particular student. */
export type GuardianOfStudent = Guardian & { relationship: string; isPrimary: boolean }

/**
 * Everyone on file as a parent or guardian.
 *
 * ── Who may read the directory ─────────────────────────────────────────
 * Only a caller who may see every student. Both screens that want it are
 * staff ones — the guardian picker on a student's page, and the dialog that
 * gives families accounts — and a school's guardian list is its parents'
 * names and mobile numbers, which is the last thing a narrowed family account
 * should be handed. Signed in as a parent this used to return all 474 rows.
 *
 * Gated on `Student` because there is no `Guardian` subject in the catalogue.
 * That is the honest long-term shape and it is a bigger change — a subject
 * needs permissions pointing at it, which means new ids, a role editor that
 * shows them and a migration. Until then: whoever may see every child may see
 * who collects them, which is the same set of people.
 *
 * @apiRoute GET /api/v1/guardians
 */
export async function fetchGuardians(): Promise<Guardian[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      if (!callerSeesEveryRow('read', 'Student')) return []
      return mockServer.listGuardians()
    },
    async () => {
      const { data } = await apiClient.get<Guardian[]>('/guardians')
      return data
    },
  )
}

/**
 * Every link, for screens that need to count children per guardian.
 *
 * The family graph of a whole school — who belongs to whom. Same gate as the
 * directory above, and for a stronger reason: the rows are the relationships
 * themselves.
 *
 * @apiRoute GET /api/v1/student-guardians
 */
export async function fetchGuardianLinks(): Promise<StudentGuardian[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 80, max: 200 })
      if (!callerSeesEveryRow('read', 'Student')) return []
      return mockServer.listLinks()
    },
    async () => {
      const { data } = await apiClient.get<StudentGuardian[]>('/student-guardians')
      return data
    },
  )
}

/**
 * The guardians of one student.
 *
 * Gated on the student it is *about*, not on the rows returned: the answer is
 * a list of other people, and what decides whether the caller may have it is
 * whose child they are asking about. The same shape as `fetchStudentById`,
 * and for the same reason — the id comes from the caller, so filtering the
 * list read did nothing for this one. Signed in as a parent, naming any
 * student returned that family's names and mobile numbers.
 *
 * An id matching no student is answered only for a caller who may see every
 * student, so a guessed id cannot be used to skip the check.
 *
 * @apiRoute GET /api/v1/students/{id}/guardians
 */
export async function fetchGuardiansOfStudent(studentProfileId: string): Promise<GuardianOfStudent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const subject = findStudent(studentProfileId)
      const allowed = subject
        ? visibleRecordToCaller(subject, 'read', 'Student', student => ({
            studentId: String(student.id),
          })) !== undefined
        : callerSeesEveryRow('read', 'Student')
      if (!allowed) return []
      return mockServer.guardiansOfStudent(studentProfileId)
    },
    async () => {
      const { data } = await apiClient.get<GuardianOfStudent[]>(
        `/students/${studentProfileId}/guardians`,
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
      // Filtered by the children it names rather than by the guardian asked
      // about: a parent naming somebody else's guardian id gets back only the
      // children they could have seen anyway, which for most callers is none.
      // Their own children come back whole, which is what the family scope is
      // built from.
      return visibleToCaller(
        mockServer.studentsOfGuardian(guardianProfileId),
        'read',
        'Student',
        studentProfileId => (findStudent(studentProfileId) ? { studentId: studentProfileId } : undefined),
      )
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
