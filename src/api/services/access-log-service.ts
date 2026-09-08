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
import * as mockServer from '@/mocks/access-log'
import type { AccessEvent, AccessEventKind, AccessChange, AccessEntity } from '@/mocks/access-log'

export type { AccessEvent, AccessEventKind, AccessChange, AccessEntity }

/**
 * The change history, newest first.
 *
 * @apiRoute GET /api/v1/access-log
 */
export async function fetchAccessEvents(limit = 100): Promise<AccessEvent[]> {
  return mockOrHttp(
    async () => {
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
