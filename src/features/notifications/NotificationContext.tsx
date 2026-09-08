/**
 * The client's copy of the notification feed.
 *
 * Holds the list, the unread count and the cursor; applies batches from
 * whichever transport is active; and re-fetches from the cursor whenever the
 * tab has plausibly missed something.
 *
 * Three reconciliation triggers, and each earns its place:
 *  - on connect, because this tab may have been closed for a day
 *  - on reconnect, because a dropped stream delivers nothing while it is down
 *  - on window focus, because a backgrounded tab throttles timers to the point
 *    where the polling transport can be minutes stale, and focus is precisely
 *    the moment a stale badge gets noticed
 *
 * Mutations are optimistic. Marking read is a local, reversible edit against a
 * server that will agree; making the user watch a spinner to grey out a row
 * they already read would be a worse trade than the rare rollback.
 */

import * as React from 'react'
import {
  fetchNotifications,
  fetchNotificationsSince,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  runNotificationSweep,
} from '@/api/services/notification-service'
import { toast } from 'sonner'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { createNotificationTransport } from './transport'

/**
 * How often to re-evaluate the time-derived rules.
 *
 * Five minutes. Nothing these rules watch changes faster than a school day,
 * and each pass walks every fee record and every class.
 */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000
import type { Notification, NotificationBatch } from './types'

interface NotificationContextValue {
  /** Muted categories already removed — see the filter in the provider. */
  notifications: Notification[]
  unreadCount: number
  /** True only for the very first load, so the panel can show skeletons once. */
  isLoading: boolean
  error: string | null
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  /** Force a catch-up fetch. Exposed for the panel's manual refresh. */
  refresh: () => void
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null)

/** Newest first — the order the panel and the dashboard tile both want. */
function byNewest(a: Notification, b: Notification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

/**
 * Fold a batch into the list.
 *
 * De-duplicates by id because the same record legitimately arrives twice: a
 * push delivers it, then a reconcile that overlaps the same cursor range
 * delivers it again. The batch's copy wins, being the fresher read of server
 * state.
 */
function applyBatch(current: Notification[], incoming: Notification[]): Notification[] {
  if (incoming.length === 0) return current

  const merged = new Map(current.map(item => [item.id, item]))
  incoming.forEach(item => merged.set(item.id, item))
  return [...merged.values()].sort(byNewest)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { config } = useSchoolConfig()
  /**
   * Muted categories are filtered on read, not on receipt.
   *
   * Nothing is dropped from state, so turning a category back on restores its
   * history at once instead of leaving a hole until the next event arrives.
   * A real backend would filter at fan-out and these would never cross the
   * wire — this is the client standing in for that, and it degrades to a
   * no-op the day the server takes over.
   */
  const mutedCategories = config.notifications.categories
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Cursor lives in a ref, not state: the transport reads it on every tick and
  // must never see a value from a stale render, and advancing it should not
  // itself cause one.
  const cursorRef = React.useRef<string | undefined>(undefined)
  // Guards against overlapping reconciles — focus and a poll tick can land
  // together, and two in-flight fetches would race to set the cursor.
  const inFlightRef = React.useRef(false)

  /**
   * True until the first batch has been folded in.
   *
   * The toast bridge below reads it: a session that opens to a backlog of
   * three overdue fees must not fire three toasts at once. Toasts are for
   * things that happened *while you were looking*; the backlog is what the
   * bell's count is for.
   */
  const isFirstBatchRef = React.useRef(true)

  const applyIncoming = React.useCallback((batch: NotificationBatch) => {
    cursorRef.current = batch.cursor
    setNotifications(current => applyBatch(current, batch.items))

    // ── Toast bridge ──
    //
    // Only `critical`, and only after the first load. A notification loud
    // enough to interrupt is rare by construction: the feed carries everything,
    // and the toast is reserved for what cannot wait for someone to open the
    // bell. Widening this to `warning` would make the app shout during a
    // routine morning and teach people to dismiss without reading.
    if (isFirstBatchRef.current) {
      isFirstBatchRef.current = false
      return
    }
    batch.items
      .filter(item => item.severity === 'critical' && item.readAt === null)
      .forEach(item => {
        toast.error(item.title, { description: item.body })
      })
  }, [])

  const reconcile = React.useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      // No cursor yet means this is the first load, which wants the whole
      // first page rather than "everything since the beginning of time".
      const batch = cursorRef.current
        ? await fetchNotificationsSince(cursorRef.current)
        : await fetchNotifications()
      applyIncoming(batch)
      setError(null)
    } catch (cause) {
      console.error('Failed to sync notifications', cause)
      setError('Could not load notifications')
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
    }
  }, [applyIncoming])

  // ── Live channel ──
  React.useEffect(() => {
    const transport = createNotificationTransport()
    transport.start({
      getCursor: () => cursorRef.current,
      onBatch: applyIncoming,
      onReconcile: () => {
        void reconcile()
      },
    })
    return () => transport.stop()
  }, [applyIncoming, reconcile])

  /**
   * Ask the mock server to re-evaluate its time-derived rules.
   *
   * On mount and then on a slow timer. Slow because nothing here is urgent to
   * the minute — a fee that fell overdue at midnight is equally overdue at
   * 09:05 — and because each sweep walks every fee record and every class.
   *
   * This call disappears when the rules move to a real scheduled job; see
   * `runNotificationSweep`.
   */
  React.useEffect(() => {
    runNotificationSweep()
    const timer = window.setInterval(runNotificationSweep, SWEEP_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  // ── Catch up when the tab comes back ──
  React.useEffect(() => {
    const catchUp = () => {
      if (document.visibilityState === 'visible') void reconcile()
    }
    window.addEventListener('focus', catchUp)
    window.addEventListener('online', catchUp)
    document.addEventListener('visibilitychange', catchUp)
    return () => {
      window.removeEventListener('focus', catchUp)
      window.removeEventListener('online', catchUp)
      document.removeEventListener('visibilitychange', catchUp)
    }
  }, [reconcile])

  // ── Mutations ──

  const markRead = React.useCallback((id: string) => {
    const readAt = new Date().toISOString()
    setNotifications(current =>
      current.map(item => (item.id === id && item.readAt === null ? { ...item, readAt } : item)),
    )
    void markNotificationRead(id).catch(cause => {
      console.error('Failed to mark notification read', cause)
      // Put it back rather than leaving the UI claiming something the server
      // never recorded.
      setNotifications(current =>
        current.map(item => (item.id === id ? { ...item, readAt: null } : item)),
      )
    })
  }, [])

  const markAllRead = React.useCallback(() => {
    const readAt = new Date().toISOString()
    // Only what the user can actually see — "mark all read" should never clear
    // a badge for notifications they were never shown.
    const previouslyUnread = notifications
      .filter(item => item.readAt === null && mutedCategories[item.category] !== false)
      .map(item => item.id)
    if (previouslyUnread.length === 0) return

    const clearing = new Set(previouslyUnread)
    setNotifications(current =>
      current.map(item => (clearing.has(item.id) ? { ...item, readAt } : item)),
    )
    void markAllNotificationsRead().catch(cause => {
      console.error('Failed to mark all notifications read', cause)
      const unreadAgain = new Set(previouslyUnread)
      setNotifications(current =>
        current.map(item => (unreadAgain.has(item.id) ? { ...item, readAt: null } : item)),
      )
    })
  }, [notifications, mutedCategories])

  const dismiss = React.useCallback(
    (id: string) => {
      const removed = notifications.find(item => item.id === id)
      setNotifications(current => current.filter(item => item.id !== id))
      void dismissNotification(id).catch(cause => {
        console.error('Failed to dismiss notification', cause)
        if (removed) setNotifications(current => applyBatch(current, [removed]))
      })
    },
    [notifications],
  )

  const visible = React.useMemo(
    () => notifications.filter(item => mutedCategories[item.category] !== false),
    [notifications, mutedCategories],
  )

  const unreadCount = React.useMemo(
    () => visible.filter(item => item.readAt === null).length,
    [visible],
  )

  const value = React.useMemo<NotificationContextValue>(
    () => ({
      notifications: visible,
      unreadCount,
      isLoading,
      error,
      markRead,
      markAllRead,
      dismiss,
      refresh: () => void reconcile(),
    }),
    [visible, unreadCount, isLoading, error, markRead, markAllRead, dismiss, reconcile],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationProvider')
  }
  return context
}
