/**
 * Access log API Service
 *
 * Mock path (the in-browser audit table under `src/mocks/access-log`) + HTTP
 * path (apiClient).
 *
 * Note the shape of `recordAccessEvent`: it takes an actor because the mock
 * has no session to read one from. The HTTP implementation does not send it —
 * a client that could name the actor on an audit record could name someone
 * else, so the server takes it from the token and ignores anything sent.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { callerMay } from '@/mocks/_shared/caller'
import * as mockServer from '@/mocks/tenant/access-log'
import type { AccessEvent, AccessEventKind, AccessChange, AccessEntity } from '@/mocks/tenant/access-log'

export type { AccessEvent, AccessEventKind, AccessChange, AccessEntity }

/**
 * The change history, newest first.
 *
 * @apiRoute GET /api/v1/access-log
 */
export async function fetchAccessEvents(limit = 100): Promise<AccessEvent[]> {
  return mockOrHttp(
    async () => {
      // Who changed whose access, and when. Gated on `users.read` because that
      // is the permission the screen showing it sits behind, and because a log
      // of administrative actions read by the people it records is a different
      // thing from a record. `callerMay` rather than `callerSeesEveryRow`: the
      // rows are about staff actions, not about a student, so there is nothing
      // for an axis to narrow.
      if (!callerMay('read', 'User')) return []
      await withLatency({ min: 80, max: 200 })
      return mockServer.listEvents(limit)
    },
    async () => {
      const { data } = await apiClient.get<AccessEvent[]>('/access-log', { params: { limit } })
      return data
    },
  )
}

/**
 * Append one line to the log.
 *
 * @apiRoute POST /api/v1/access-log
 */
export async function recordAccessEvent(input: {
  actorName: string
  kind: AccessEventKind
  target: string
  summary: string
  detail?: string
  change?: AccessChange
  undoOf?: string
}): Promise<AccessEvent | null> {
  return mockOrHttp(
    async () => mockServer.recordEvent(input),
    async () => {
      const { actorName: _ignored, ...body } = input
      const { data } = await apiClient.post<AccessEvent>('/access-log', body)
      return data
    },
  )
}
