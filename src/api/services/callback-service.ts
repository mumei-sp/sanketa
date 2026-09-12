/**
 * Callback requests — a parent asking the school to ring them back.
 *
 * Mock path + HTTP path per endpoint, like every other service here.
 *
 * ── Who may do what ───────────────────────────────────────────────────
 * Both reads and the write are guarded on the STUDENT axis rather than on a
 * permission of their own. A callback request is a fact about one child, so
 * "may you see this child" is the whole question — and it is a question every
 * role in the app can already answer: a parent is narrowed to their own
 * children, a class teacher to their classes, an admin to everyone.
 *
 * That is deliberate rather than lazy. A `callbacks.read` would have had to be
 * granted to parents to let them raise one, and an unnarrowed permission handed
 * to families is how the transport card nearly leaked every child's pickup
 * point — see `fetchStudentRide`. The axis that already exists is the safer
 * one, and it needs no change to the role editor.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { visibleToCaller, visibleRecordToCaller } from '@/mocks/_shared/caller'
import * as callbackServer from '@/mocks/tenant/callbacks/store'
import { findStudent } from '@/mocks/tenant/students'
import { classSectionOf } from '@/utils/class-section-helpers'
import type { CallbackRequest, CallbackReason } from '@/mocks/tenant/callbacks/store'

export type { CallbackRequest, CallbackReason }

/** The scope a request is judged by: the child it is about. */
function subjectOf(row: CallbackRequest) {
  const student = findStudent(row.studentId)
  return {
    studentId: row.studentId,
    classSection: student ? classSectionOf(student) : undefined,
  }
}

/**
 * Every request this caller may see, newest first.
 *
 * Narrowed by the child rather than refused wholesale: a class teacher sees the
 * ones about their own pupils, a parent sees their own, and neither learns that
 * the others exist.
 *
 * @apiRoute GET /api/v1/callbacks
 */
export async function fetchCallbacks(options?: {
  studentId?: string
  openOnly?: boolean
}): Promise<CallbackRequest[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const rows = visibleToCaller(
        callbackServer.listCallbacks(options?.studentId),
        'read',
        'Student',
        subjectOf,
      )
      return options?.openOnly ? rows.filter(row => row.resolvedAt === null) : rows
    },
    async () => {
      const { data } = await apiClient.get<CallbackRequest[]>('/callbacks', { params: options })
      return data
    },
  )
}

/**
 * Ask to be called back about one child.
 *
 * Guarded on the same axis the read is, which is what stops a parent raising a
 * request against somebody else's child by passing their id — the only input
 * here that is worth forging.
 *
 * Records the intent and sends nothing: there is no telephony behind this, and
 * the honest version of this endpoint in a real system would queue a task and
 * write exactly this row either way.
 *
 * @apiRoute POST /api/v1/callbacks
 */
export async function requestCallback(input: {
  studentId: string
  requestedBy: string
  teacherName: string | null
  reason: CallbackReason
  note: string
}): Promise<CallbackRequest | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const student = findStudent(input.studentId)
      if (!student) return null
      const mine = visibleRecordToCaller(student, 'read', 'Student', row => ({
        studentId: String(row.id),
        classSection: classSectionOf(row),
      }))
      if (!mine) return null

      return callbackServer.recordCallback({
        studentId: String(student.id),
        studentName: [student.firstName, student.lastName].filter(Boolean).join(' '),
        requestedBy: input.requestedBy,
        teacherName: input.teacherName,
        reason: input.reason,
        note: input.note,
      })
    },
    async () => {
      const { data } = await apiClient.post<CallbackRequest>('/callbacks', input)
      return data
    },
  )
}

/**
 * Mark one done.
 *
 * Same axis again, so whoever may see the child may close the request about
 * them. That does include the parent who raised it, which is the right answer:
 * somebody who has been rung back and no longer needs a call is the person best
 * placed to say so.
 *
 * @apiRoute POST /api/v1/callbacks/{id}/resolve
 */
export async function resolveCallback(
  id: string,
  resolvedBy: string,
): Promise<CallbackRequest | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const row = callbackServer.listCallbacks().find(candidate => candidate.id === id)
      if (!row) return null
      if (!visibleRecordToCaller(row, 'read', 'Student', subjectOf)) return null
      return callbackServer.resolveCallback(id, resolvedBy) ?? null
    },
    async () => {
      const { data } = await apiClient.post<CallbackRequest>(`/callbacks/${id}/resolve`, {
        resolvedBy,
      })
      return data
    },
  )
}
