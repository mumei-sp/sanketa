/**
 * One row of the notification feed.
 *
 * A row is a button, not a card with a button in it: the whole thing is the
 * target, which is the only version that works under a thumb. The dismiss
 * control is the exception, and it stops propagation so removing a row never
 * also navigates to it.
 *
 * Unread is carried by weight and a dot rather than a filled background —
 * a tinted row per unread item turns a busy feed into stripes, and the count
 * on the bell already says how many there are.
 */

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { colors } from '@/theme/colors'
import {
  formatAbsoluteTime,
  formatRelativeTime,
  getCategoryIcon,
  getCategoryLabel,
  getSeverityColor,
  getSeverityTint,
} from '../utils/notification-display'
import type { Notification } from '../types'

export interface NotificationItemProps {
  notification: Notification
  onSelect: (notification: Notification) => void
  onDismiss: (id: string) => void
}

export function NotificationItem({ notification, onSelect, onDismiss }: NotificationItemProps) {
  const Icon = getCategoryIcon(notification.category)
  const isUnread = notification.readAt === null
  const severityColor = getSeverityColor(notification.severity)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(notification)
        }
      }}
      className={cn(
        'group relative flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        'hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring',
      )}
      aria-label={`${getCategoryLabel(notification.category)}: ${notification.title}${isUnread ? ' (unread)' : ''}`}
    >
      {/* Medallion — category glyph, severity tint */}
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: getSeverityTint(notification.severity) }}
      >
        <Icon className="size-4" style={{ color: severityColor }} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn('text-body leading-snug break-words', isUnread && 'font-semibold')}
          style={{ color: 'var(--heading)' }}
        >
          {notification.title}
        </span>

        {notification.body && (
          <span className="text-caption leading-snug break-words text-muted-foreground line-clamp-2">
            {notification.body}
          </span>
        )}

        <span className="text-caption text-muted-foreground">
          {notification.actor && <>{notification.actor.name} · </>}
          <time dateTime={notification.createdAt} title={formatAbsoluteTime(notification.createdAt)}>
            {formatRelativeTime(notification.createdAt)}
          </time>
        </span>
      </div>

      {/* Unread dot and dismiss get a column each rather than sharing one.
          Stacked, they overlapped on touch — where there is no hover to hide
          the dot — and read as a smudge. Both columns are always reserved, so
          revealing dismiss on hover never shifts the text beside it. */}
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center pt-2">
        {isUnread && (
          <span className="size-2 rounded-full" style={{ backgroundColor: severityColor }} />
        )}
      </span>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation()
          onDismiss(notification.id)
        }}
        aria-label={`Dismiss: ${notification.title}`}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity',
          'hover:bg-muted group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring',
          // No hover on touch to reveal it, so it simply stays visible — and
          // grows to a tappable box, which is why it is not a `tap-area`
          // overlay: those swallow the taps of neighbours this close.
          'touch:size-9 touch:opacity-70',
        )}
      >
        <X className="size-3.5" style={{ color: colors.text.muted }} />
      </button>
    </div>
  )
}
