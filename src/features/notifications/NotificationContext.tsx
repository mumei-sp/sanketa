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
} from '@/api/services/notification-service'
import { createNotificationTransport } from './transport'
import type { Notification, NotificationBatch } from './types'

interface NotificationContextValue {
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

  const applyIncoming = React.useCallback((batch: NotificationBatch) => {
    cursorRef.current = batch.cursor
    setNotifications(current => applyBatch(current, batch.items))
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
    const previouslyUnread = notifications.filter(item => item.readAt === null).map(item => item.id)
    if (previouslyUnread.length === 0) return

    setNotifications(current =>
      current.map(item => (item.readAt === null ? { ...item, readAt } : item)),
    )
    void markAllNotificationsRead().catch(cause => {
      console.error('Failed to mark all notifications read', cause)
      const unreadAgain = new Set(previouslyUnread)
      setNotifications(current =>
        current.map(item => (unreadAgain.has(item.id) ? { ...item, readAt: null } : item)),
      )
    })
  }, [notifications])

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

  const unreadCount = React.useMemo(
    () => notifications.filter(item => item.readAt === null).length,
    [notifications],
  )

  const value = React.useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      markRead,
      markAllRead,
      dismiss,
      refresh: () => void reconcile(),
    }),
    [notifications, unreadCount, isLoading, error, markRead, markAllRead, dismiss, reconcile],
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
