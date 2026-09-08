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
import { usePermissions } from '@/features/auth/PermissionContext'
import { createNotificationTransport } from './transport'

/**
 * How often to re-evaluate the time-derived rules.
 *
 * Five minutes. Nothing these rules watch changes faster than a school day,
 * and each pass walks every fee record and every class.
 */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

/**
 * How recent a notification must be to interrupt.
 *
 * The catch-up gate covers the moment a session opens. This covers the other
 * way a backlog arrives: a laptop sleeps for three hours, wakes, and the
 * visibility listener reconciles a batch of everything raised meanwhile. The
 * gate opened hours ago, so without this every critical in that batch would
 * toast at once — the same wall of red, arriving by a different door.
 *
 * A minute is generous for "while you were looking" and far short of any
 * plausible sleep.
 */
const TOAST_MAX_AGE_MS = 60 * 1000
import type { Notification, NotificationBatch, NotificationViewer } from './types'

interface NotificationContextValue {
  /** Muted categories already removed — see the filter in the provider. */
  notifications: Notification[]
  /**
   * What happened, as opposed to what might need you.
   *
   * The dashboard's Recent Activity tile used to render the top of
   * `notifications`, which put the same six rows on screen as the bell badge
   * sitting directly above it — one screen saying the same thing twice, which
   * is most of what makes an app feel cluttered.
   *
   * Split on severity because that axis already exists and already means this:
   * `info` and `success` are receipts — a payment recorded, a register
   * submitted, grades entered. They are worth seeing and never worth chasing.
   * `warning` and `critical` are requests, and they belong to the bell, where
   * someone has gone looking for them.
   */
  activity: Notification[]
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

  /**
   * The permissions this feed is being read with.
   *
   * Two filters run on this feed and they are different in kind. *Audience* is
   * authorization: the server decides what reaches you, and it is enforced on
   * delivery below. *Muted categories* is a preference: it hides what did
   * reach you, on read, so unmuting brings history back rather than a hole.
   *
   * Held in a ref as well as a memo because `reconcile` must read the current
   * viewer without being rebuilt — a new identity there would restart the
   * transport on every render.
   */
  const { role, isReady: permissionsReady } = usePermissions()
  const viewer = React.useMemo<NotificationViewer>(
    () => ({ permissions: role?.permissions ?? [] }),
    [role],
  )
  const viewerRef = React.useRef(viewer)
  viewerRef.current = viewer

  /**
   * Changes whenever the answer to "what may this reader see" changes —
   * including while previewing another role, which narrows the feed the same
   * way it narrows the sidebar.
   */
  const viewerKey = React.useMemo(
    () => [...viewer.permissions].sort().join('|'),
    [viewer],
  )
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
   * Whether the session has finished catching up.
   *
   * The toast bridge below reads it: a session opening onto three overdue fees
   * must not fire three toasts at once. Toasts are for what happens *while you
   * are looking*; a backlog is what the bell's count is for.
   *
   * Two things have to land before anything counts as live, and the first
   * version of this only waited for one of them. The initial fetch is the
   * obvious half. The other is the first sweep: it runs after that fetch
   * resolves and publishes the whole day's derived alerts at once, so its
   * output arrived as "live" activity and shouted the backlog on the first
   * load of every day. A fee ten days overdue was already true when you
   * arrived — it is being discovered now, not happening now.
   *
   * The order the two settle in does not matter; whichever is second opens the
   * gate. Anything genuinely new that lands inside that window (a second or
   * two) is quietly folded into the feed instead of toasted, which is the
   * right way to be wrong here.
   */
  const catchUpRef = React.useRef({ fetched: false, swept: false })

  /**
   * Both halves in, so anything arriving now is genuinely new.
   *
   * Derived rather than stored, and the two halves have different lifetimes,
   * which is the part that bit: `swept` is about the *server* — the day's
   * derived alerts have been raised — and stays true for the session. `fetched`
   * is about *this reader*, and resets when the viewer changes. Storing a
   * combined `done` flag meant a viewer change reset `swept` too, and since the
   * sweep only runs on mount and on a timer, the gate stayed shut and no toast
   * ever fired again.
   */
  const isCaughtUp = React.useCallback(
    () => catchUpRef.current.fetched && catchUpRef.current.swept,
    [],
  )

  const noteCaughtUp = React.useCallback((half: 'fetched' | 'swept') => {
    catchUpRef.current[half] = true
  }, [])

  const applyIncoming = React.useCallback((batch: NotificationBatch) => {
    cursorRef.current = batch.cursor
    setNotifications(current => applyBatch(current, batch.items))

    // ── Toast bridge ──
    //
    // Only `critical`, and only once the session has caught up. A notification
    // loud enough to interrupt is rare by construction: the feed carries
    // everything, and the toast is reserved for what cannot wait for someone to
    // open the bell. Widening this to `warning` would make the app shout during
    // a routine morning and teach people to dismiss without reading.
    if (!isCaughtUp()) return
    const now = Date.now()
    batch.items
      .filter(
        item =>
          item.severity === 'critical' &&
          item.readAt === null &&
          now - new Date(item.createdAt).getTime() < TOAST_MAX_AGE_MS,
      )
      .forEach(item => {
        toast.error(item.title, { description: item.body })
      })
  }, [isCaughtUp])

  const reconcile = React.useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      // No cursor yet means this is the first load, which wants the whole
      // first page rather than "everything since the beginning of time".
      const batch = cursorRef.current
        ? await fetchNotificationsSince(cursorRef.current, undefined, viewerRef.current)
        : await fetchNotifications(undefined, viewerRef.current)
      applyIncoming(batch)
      setError(null)
    } catch (cause) {
      console.error('Failed to sync notifications', cause)
      setError('Could not load notifications')
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
      // Marked after `applyIncoming`, so the batch this call just delivered is
      // itself still treated as catch-up rather than as live activity.
      noteCaughtUp('fetched')
    }
  }, [applyIncoming, noteCaughtUp])

  // ── Live channel ──
  React.useEffect(() => {
    // Nothing until the roles table has landed. Connecting first would fetch
    // with no permissions, and an empty feed is indistinguishable from a quiet
    // one — the reader would have no way to tell they were seeing nothing.
    if (!permissionsReady) return

    // A different viewer is a different feed, so start it over rather than
    // appending: the cursor belongs to the old audience, and rows already on
    // screen may not be this reader's to see.
    cursorRef.current = undefined
    setNotifications([])
    // Only this reader's half. `swept` belongs to the session, not the viewer.
    catchUpRef.current.fetched = false

    const transport = createNotificationTransport()
    transport.start({
      viewer: viewerRef.current,
      getCursor: () => cursorRef.current,
      onBatch: applyIncoming,
      onReconcile: () => {
        void reconcile()
      },
    })
    return () => transport.stop()
  }, [permissionsReady, viewerKey, applyIncoming, reconcile])

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
    // Awaited rather than fired and forgotten: the first pass is catch-up, and
    // the toast gate stays shut until it has finished publishing.
    void runNotificationSweep().finally(() => noteCaughtUp('swept'))
    const timer = window.setInterval(() => {
      void runNotificationSweep()
    }, SWEEP_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [noteCaughtUp])

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
    void markAllNotificationsRead(viewerRef.current).catch(cause => {
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

  const activity = React.useMemo(
    () => visible.filter(item => item.severity === 'info' || item.severity === 'success'),
    [visible],
  )

  const unreadCount = React.useMemo(
    () => visible.filter(item => item.readAt === null).length,
    [visible],
  )

  const value = React.useMemo<NotificationContextValue>(
    () => ({
      notifications: visible,
      activity,
      unreadCount,
      isLoading,
      error,
      markRead,
      markAllRead,
      dismiss,
      refresh: () => void reconcile(),
    }),
    [visible, activity, unreadCount, isLoading, error, markRead, markAllRead, dismiss, reconcile],
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
