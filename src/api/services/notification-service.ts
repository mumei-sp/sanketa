/**
 * Notification API Service
 *
 * Mock path (the in-browser notification server under `src/mocks/notifications`)
 * + HTTP path (apiClient). The mock server owns the store, the read state and
 * the cursor exactly as a backend would, so flipping `VITE_USE_MOCK_API`
 * changes which implementation runs and nothing else.
 *
 * Note what is missing: there is no `createNotification`. The client never
 * authors a notification — it performs a domain action, and the server decides
 * who to tell. `emitDomainEvent` below is the one seam where that happens, and
 * in HTTP mode it deliberately does nothing.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { getEnvConfig } from '@/api/utils/env'
import * as mockServer from '@/mocks/notifications'
import { authUtils } from '@/api/utils/auth'
import type {
  DomainEvent,
  Notification,
  NotificationActor,
  NotificationBatch,
} from '@/features/notifications/types'

/**
 * Who is performing the action.
 *
 * Read from the session rather than passed in by the caller, because that is
 * where a backend reads it from — a client that could name its own actor could
 * name someone else's.
 */
function currentActor(): NotificationActor | null {
  const user = authUtils.getUser()
  return user ? { id: user.id, name: user.fullName } : null
}

/**
 * First page of the feed, newest first.
 *
 * @apiRoute GET /api/v1/notifications
 */
export async function fetchNotifications(limit = 50): Promise<NotificationBatch> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      return mockServer.getAll(limit)
    },
    async () => {
      const { data } = await apiClient.get<NotificationBatch>('/notifications', {
        params: { limit },
      })
      return data
    },
  )
}

/**
 * Everything newer than `cursor` — the reconciliation call.
 *
 * Every client makes this on connect, on reconnect and on window focus, no
 * matter which transport it uses: a pushed batch can be missed while the tab
 * is asleep or the connection is down, and the cursor is what closes the gap.
 *
 * @apiRoute GET /api/v1/notifications?since={cursor}
 */
export async function fetchNotificationsSince(
  cursor: string | undefined,
  limit = 50,
): Promise<NotificationBatch> {
  return mockOrHttp(
    async () => {
      // Lower latency than a page fetch: this runs on a timer in polling mode,
      // and a slow reconcile would make the badge feel laggy.
      await withLatency({ min: 80, max: 220 })
      return mockServer.getSince(cursor, limit)
    },
    async () => {
      const { data } = await apiClient.get<NotificationBatch>('/notifications', {
        params: { since: cursor, limit },
      })
      return data
    },
  )
}

/**
 * @apiRoute PATCH /api/v1/notifications/{id}/read
 */
export async function markNotificationRead(id: string): Promise<Notification | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 60, max: 160 })
      return mockServer.markRead(id)
    },
    async () => {
      const { data } = await apiClient.patch<Notification>(`/notifications/${id}/read`)
      return data
    },
  )
}

/**
 * Returns how many were unread before the call.
 *
 * @apiRoute POST /api/v1/notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<number> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 80, max: 200 })
      return mockServer.markAllRead()
    },
    async () => {
      const { data } = await apiClient.post<{ updated: number }>('/notifications/read-all')
      return data.updated
    },
  )
}

/**
 * @apiRoute DELETE /api/v1/notifications/{id}
 */
export async function dismissNotification(id: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 60, max: 160 })
      mockServer.dismiss(id)
    },
    async () => {
      await apiClient.delete(`/notifications/${id}`)
    },
  )
}

/**
 * Report that something happened.
 *
 * Called from the *mock branch* of the services that mutate data — after
 * `submitGrades` writes its submission, say. It is fire-and-forget on purpose:
 * a notification failing to derive must never fail the action that caused it.
 *
 * In HTTP mode this is a no-op, and that asymmetry is the point. A real
 * backend already knows the action happened — it just handled the POST — so it
 * raises the notification itself. If the client called an endpoint here, every
 * client would need the fan-out rules and users other than the actor would
 * never be told. See `src/mocks/notifications/rules.ts`.
 */
export function emitDomainEvent(event: DomainEvent): void {
  if (!getEnvConfig().useMockApi) return
  try {
    mockServer.publish({ actor: currentActor(), ...event })
  } catch (error) {
    console.error('Failed to publish domain event', event.type, error)
  }
}

/**
 * Open a live channel, or nothing in HTTP mode where the transport layer talks
 * to a real `EventSource` instead. Returns an unsubscribe function.
 */
export function subscribeToMockServer(
  listener: (batch: NotificationBatch) => void,
): () => void {
  return mockServer.subscribe(listener)
}
