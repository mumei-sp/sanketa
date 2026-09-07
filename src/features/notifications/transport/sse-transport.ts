/**
 * Server-sent events transport — the server pushes, the client listens.
 *
 * SSE rather than a WebSocket because this channel only ever runs one way.
 * A notification feed has nothing to say back, and SSE gives away nothing for
 * that constraint: it rides plain HTTP with no upgrade handshake, reconnects
 * on its own, and replays from `Last-Event-ID` after a drop. A WebSocket earns
 * its extra moving parts when the client also needs to talk — presence,
 * typing, cursors — which is not this.
 *
 * Two implementations live here behind one factory:
 *
 *  - Mock mode subscribes to the in-browser notification server. That is a
 *    genuine push: publishing a domain event anywhere in the app delivers here
 *    with no polling in between, so the live path is real code being exercised
 *    rather than a stub waiting for a backend.
 *  - HTTP mode opens a real `EventSource`.
 *
 * Both reconcile on connect. The browser's own reconnect is invisible to us —
 * `EventSource` retries silently — so `onerror` marks the channel down and the
 * next successful `onopen` triggers the catch-up fetch.
 */

import { getEnvConfig } from '@/api/utils/env'
import { subscribeToMockServer } from '@/api/services/notification-service'
import type { NotificationBatch } from '../types'
import type { NotificationTransport, TransportContext } from './types'

/** Mock mode: the in-browser server is the stream. */
function createMockStreamTransport(): NotificationTransport {
  let unsubscribe: (() => void) | null = null

  return {
    name: 'sse',

    start(context: TransportContext) {
      // Catch up on anything that landed while this tab was closed, before
      // opening the live channel — same order a real client connects in.
      context.onReconcile()
      unsubscribe = subscribeToMockServer((batch: NotificationBatch) => {
        context.onBatch(batch)
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },
  }
}

/** HTTP mode: a real EventSource against the backend. */
function createEventSourceTransport(): NotificationTransport {
  let source: EventSource | null = null
  let wasDisconnected = false

  return {
    name: 'sse',

    start(context: TransportContext) {
      const { apiBaseUrl } = getEnvConfig()
      const cursor = context.getCursor()
      const url = `${apiBaseUrl}/notifications/stream${cursor ? `?since=${encodeURIComponent(cursor)}` : ''}`

      context.onReconcile()

      source = new EventSource(url, { withCredentials: true })

      source.onopen = () => {
        // Only reconcile on a *re*-open. The first open was already covered
        // above, and repeating it would double every connect.
        if (wasDisconnected) {
          wasDisconnected = false
          context.onReconcile()
        }
      }

      source.onmessage = event => {
        try {
          context.onBatch(JSON.parse(event.data) as NotificationBatch)
        } catch (error) {
          // A malformed frame must not kill the channel — the reconcile on the
          // next reconnect will recover whatever this frame carried.
          console.error('Malformed notification frame', error)
        }
      }

      source.onerror = () => {
        // EventSource retries by itself; all we do is remember that it fell
        // over, so the next onopen knows to catch up.
        wasDisconnected = true
      }
    },

    stop() {
      source?.close()
      source = null
      wasDisconnected = false
    },
  }
}

export function createSseTransport(): NotificationTransport {
  return getEnvConfig().useMockApi ? createMockStreamTransport() : createEventSourceTransport()
}
