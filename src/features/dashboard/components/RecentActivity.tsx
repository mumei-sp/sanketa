/**
 * Recent Activity — the dashboard's window onto the notification feed.
 *
 * It used to have its own `RecentActivityItem` mock, which meant the dashboard
 * and the bell told two versions of the same story from two datasets that
 * could drift apart. It now reads the notification store, so there is one
 * source of truth and one place to add an event type.
 *
 * It stays a *view*, not a second panel: no read state, no dismiss, no
 * mark-all. Those belong to the bell, where someone has actually gone looking
 * for them. Rows still navigate, because a feed you cannot follow is a poster.
 */

import { Ellipsis } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/features/notifications/NotificationContext'
import {
  formatAbsoluteTime,
  formatRelativeTime,
  getCategoryIcon,
  getSeverityColor,
  getSeverityTint,
} from '@/features/notifications/utils/notification-display'

/** Enough to fill the tile without turning the dashboard into an inbox. */
const VISIBLE_COUNT = 6

function ActivitySkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map(row => (
        <div key={row} className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </>
  )
}

export function RecentActivity() {
  const { notifications, isLoading } = useNotifications()
  const navigate = useNavigate()
  const items = notifications.slice(0, VISIBLE_COUNT)

  return (
    <Tile
      id="recent-activity-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
      className="h-full"
    >
      <Card className="pt-4 pb-4 flex flex-col gap-0 h-full border-0 shadow-none bg-transparent">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">Recent Activity</h3>
          <CardAction>
            <button className="tap-area p-1 rounded-md hover:bg-accent transition-colors">
              <Ellipsis className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 flex-1 min-h-0 overflow-y-auto space-y-5">
          {isLoading ? (
            <ActivitySkeleton />
          ) : items.length === 0 ? (
            <p className="text-body-muted text-muted-foreground py-4">
              Nothing has happened yet today.
            </p>
          ) : (
            items.map(item => {
              const Icon = getCategoryIcon(item.category)
              const color = getSeverityColor(item.severity)
              const clickable = item.target !== null

              return (
                <div
                  key={item.id}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => navigate(item.target!.route) : undefined}
                  onKeyDown={
                    clickable
                      ? event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            navigate(item.target!.route)
                          }
                        }
                      : undefined
                  }
                  className={
                    clickable
                      ? 'flex gap-3 items-start rounded-md cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring'
                      : 'flex gap-3 items-start'
                  }
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: getSeverityTint(item.severity) }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-body font-medium leading-tight break-words"
                      style={{ color: 'var(--heading)' }}
                    >
                      {item.title}
                    </p>
                    <p className="text-caption text-muted-foreground mt-1">
                      {item.actor && <>{item.actor.name} · </>}
                      <time dateTime={item.createdAt} title={formatAbsoluteTime(item.createdAt)}>
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </Tile>
  )
}
