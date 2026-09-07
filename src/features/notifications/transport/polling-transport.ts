/**
 * Polling transport — ask the server for anything new, on a timer.
 *
 * The unglamorous one, and the one most products actually launch with: no
 * infrastructure, no connection state, works through every proxy. Its whole
 * implementation is "call reconcile on an interval", because polling *is*
 * reconciliation — the same `?since=<cursor>` request the push transport
 * makes after a dropped connection, just made repeatedly.
 *
 * The interval is a deliberate compromise. Shorter feels live but spends
 * requests on a feed that changes a handful of times a day; longer is cheap
 * but leaves the badge visibly stale. 45s sits where most products land for a
 * notification bell — and matters less here than it looks, because the store
 * also reconciles whenever the window regains focus, which is when a stale
 * badge would actually be noticed.
 */

import type { NotificationTransport, TransportContext } from './types'

const POLL_INTERVAL_MS = 45_000

export function createPollingTransport(): NotificationTransport {
  let timer: ReturnType<typeof setInterval> | null = null

  return {
    name: 'poll',

    start(context: TransportContext) {
      // Catch up immediately rather than making the first tab of the session
      // wait a full interval to learn what it missed.
      context.onReconcile()
      timer = setInterval(() => context.onReconcile(), POLL_INTERVAL_MS)
    },

    stop() {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    },
  }
}
