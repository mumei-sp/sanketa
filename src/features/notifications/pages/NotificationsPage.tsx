/**
 * The full notification history.
 *
 * The bell's panel is a peek: it shows what arrived recently, in a popover
 * sized for a glance, and it is the wrong place to answer "when did the fee
 * reminder for 8B go out?" or "what did I miss last week?". Those need
 * filtering and a page that scrolls.
 *
 * It reads the same context the panel does rather than fetching its own copy.
 * Two readers of one feed that fetched separately would show different unread
 * counts the moment one of them marked something read, and the count in the
 * bell is the number people trust.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, Filter } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'
import { cn } from '@/lib/utils'
import { border, text } from '@/theme/colors'
import { useNotifications } from '../NotificationContext'
import { NotificationItem } from '../components/NotificationItem'
import { getCategoryLabel, groupByDay } from '../utils/notification-display'
import type { Notification, NotificationCategory } from '../types'

/** The category filter, built from what is actually in the feed. */
function categoriesIn(notifications: Notification[]): NotificationCategory[] {
  const seen = new Set<NotificationCategory>()
  notifications.forEach(notification => seen.add(notification.category))
  return [...seen]
}

type ReadFilter = 'all' | 'unread'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead, dismiss } =
    useNotifications()

  const [readFilter, setReadFilter] = React.useState<ReadFilter>('all')
  const [category, setCategory] = React.useState<NotificationCategory | 'all'>('all')

  const categories = React.useMemo(() => categoriesIn(notifications), [notifications])

  const visible = React.useMemo(
    () =>
      notifications.filter(notification => {
        if (readFilter === 'unread' && notification.readAt !== null) return false
        if (category !== 'all' && notification.category !== category) return false
        return true
      }),
    [notifications, readFilter, category],
  )

  const groups = React.useMemo(() => groupByDay(visible), [visible])

  const handleSelect = React.useCallback(
    (notification: Notification) => {
      markRead(notification.id)
      if (notification.target?.route) navigate(notification.target.route)
    },
    [markRead, navigate],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Notifications' }]}
      />

      <Tile id="notifications-list" layoutMode="block" background="card" padding="p-0">
        {/* Filters. Read state and category are the two axes people actually
            arrive with — "what have I not seen" and "what happened in fees". */}
        <div
          className="flex flex-wrap items-center gap-2 border-b p-3"
          style={{ borderColor: border.default }}
        >
          <div
            className="flex rounded-lg border p-0.5"
            style={{ borderColor: border.default }}
            role="group"
            aria-label="Filter by read state"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              ] as const
            ).map(option => (
              <button
                key={option.id}
                type="button"
                aria-pressed={readFilter === option.id}
                onClick={() => setReadFilter(option.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-caption font-medium transition-colors',
                  readFilter === option.id ? 'bg-muted' : 'hover:bg-muted/50',
                )}
                style={{ color: readFilter === option.id ? 'var(--heading)' : text.muted }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <span className="flex flex-wrap items-center gap-1.5">
            <Filter className="size-3.5" style={{ color: text.muted }} aria-hidden />
            <button
              type="button"
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                category === 'all' ? 'bg-[var(--heading)] text-[var(--card)]' : 'hover:bg-muted',
              )}
              style={{ borderColor: category === 'all' ? 'var(--heading)' : border.default }}
            >
              Everything
            </button>
            {categories.map(candidate => (
              <button
                key={candidate}
                type="button"
                aria-pressed={category === candidate}
                onClick={() => setCategory(candidate)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                  category === candidate
                    ? 'bg-[var(--heading)] text-[var(--card)]'
                    : 'hover:bg-muted',
                )}
                style={{ borderColor: category === candidate ? 'var(--heading)' : border.default }}
              >
                {getCategoryLabel(candidate)}
              </button>
            ))}
          </span>

          <span className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-1 p-3">
            {[0, 1, 2, 3, 4, 5].map(row => (
              <div key={row} className="flex items-start gap-3 px-3 py-2.5">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <p className="p-6 text-center text-caption" style={{ color: 'var(--destructive)' }}>
            {error}
          </p>
        )}

        {!isLoading && !error && visible.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<BellOff className="size-6" />}
              title={
                notifications.length === 0 ? 'Nothing yet' : 'Nothing matches those filters'
              }
              description={
                notifications.length === 0
                  ? 'Notifications about attendance, fees, notices and the timetable will collect here.'
                  : 'Try another category, or switch back to All.'
              }
            />
          </div>
        )}

        {!isLoading &&
          groups.map(group => (
            <div key={group.group}>
              <div
                className="sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-1.5"
                style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: text.muted }}
                >
                  {group.group}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {group.items.length}
                </Badge>
              </div>
              {group.items.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={handleSelect}
                  onDismiss={dismiss}
                />
              ))}
            </div>
          ))}
      </Tile>
    </div>
  )
}
