/**
 * The feed body — shared verbatim by the desktop popover and the mobile sheet.
 *
 * Both surfaces render this and differ only in their frame, so the two can
 * never drift into subtly different feeds.
 *
 * Day headings rather than a flat list: a notification's age is most of how
 * you triage it, and "Today / Yesterday / Earlier" answers that without
 * spending a line per row on a full date.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNotifications } from '../NotificationContext'
import { groupByDay } from '../utils/notification-display'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '../types'

export interface NotificationPanelProps {
  /** Fired after a row is chosen, so the surface can close itself. */
  onNavigate: (notification: Notification) => void
  /**
   * When given, the header renders a close button.
   *
   * The sheet has its own absolutely-positioned close, but it lands on top of
   * "Mark all read". Owning the control here instead keeps the header a single
   * row that lays itself out, rather than one with a hole cut in it.
   */
  onClose?: () => void
  className?: string
}

function PanelSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[0, 1, 2, 3].map(row => (
        <div key={row} className="flex items-start gap-3 px-3 py-2.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationPanel({ onNavigate, onClose, className }: NotificationPanelProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead, dismiss } =
    useNotifications()

  const groups = React.useMemo(() => groupByDay(notifications), [notifications])

  const handleSelect = React.useCallback(
    (notification: Notification) => {
      if (notification.readAt === null) markRead(notification.id)
      onNavigate(notification)
    },
    [markRead, onNavigate],
  )

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-1 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-section-title" style={{ color: 'var(--heading)' }}>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 text-caption font-normal text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            title="Mark all read"
            className="h-control shrink-0 gap-1.5 px-2 text-xs"
          >
            <CheckCheck className="size-3.5" />
            {/* The label is the first thing to go when the title, the count,
                this and a close button all want the same 375px. */}
            <span className="max-[26rem]:sr-only">Mark all read</span>
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close notifications"
            className="tap-target size-8 shrink-0 rounded-lg"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Body ── */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <PanelSkeleton />
        ) : error ? (
          <EmptyState
            icon={<BellOff />}
            title="Couldn't load notifications"
            description={error}
            className="py-12"
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff />}
            title="You're all caught up"
            description="New activity across the school will show up here."
            className="py-12"
          />
        ) : (
          groups.map(({ group, items }) => (
            <section key={group} className="py-1">
              <h3 className="px-4 py-1.5 text-caption font-medium text-muted-foreground">
                {group}
              </h3>
              <div className="space-y-0.5 px-2 pb-1">
                {items.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onSelect={handleSelect}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* The panel is a peek; the page is the archive. Only offered once there
          is something to look back at. */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => {
              onClose?.()
              navigate('/notifications')
            }}
            className="w-full py-2.5 text-caption font-medium transition-colors hover:bg-muted"
            style={{ color: 'var(--heading)' }}
          >
            See all notifications
          </button>
        </>
      )}
    </div>
  )
}
