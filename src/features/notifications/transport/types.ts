/**
 * How notifications get from the server to this tab.
 *
 * Two implementations sit behind this interface — a push channel and a timer —
 * because real products ship both. Push is what you want (instant, cheap when
 * idle) but it cannot stand alone: connections drop, laptops sleep, tabs get
 * backgrounded, and anything sent during that window is simply gone. So every
 * transport also has to be able to say "catch up", and the store answers that
 * by re-fetching from its cursor.
 *
 * Keeping the choice behind one interface means the decision is a config flag
 * rather than a refactor, and means the polling path stays exercised as the
 * fallback instead of rotting.
 */

import type { NotificationBatch, NotificationViewer } from '../types'

/**
 * What the store lends the transport. All three are read fresh on every call,
 * so a transport never holds a stale cursor or a stale closure over state.
 */
export interface TransportContext {
  /**
   * Who this connection belongs to.
   *
   * Only the mock stream uses it — a real `EventSource` carries the session
   * cookie and the server decides. Undefined means unrestricted, which is what
   * a caller that has not resolved its permissions yet should get rather than
   * an empty feed.
   */
  viewer?: NotificationViewer
  /** Newest cursor the store has applied. `undefined` before the first batch. */
  getCursor: () => string | undefined
  /** A batch arrived over the live channel. Push transports only. */
  onBatch: (batch: NotificationBatch) => void
  /**
   * Ask the store to fetch everything since its cursor.
   *
   * Called on first connect and on every reconnect. For the polling transport
   * this is the entire mechanism; for the push transport it is the safety net
   * that closes the gap a dropped connection left behind.
   */
  onReconcile: () => void
}

export interface NotificationTransport {
  /** Identifies the active transport in logs and dev tooling. */
  readonly name: 'sse' | 'poll'
  start(context: TransportContext): void
  stop(): void
}
