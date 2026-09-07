/**
 * The bell, its badge, and whichever surface the feed opens into.
 *
 * Two surfaces, one panel. A popover anchored to the bell is right on desktop,
 * where the page stays visible behind it and the pointer is already there. On
 * a phone the same popover would be a cramped box floating over the content it
 * covers, so the feed becomes a full-screen sheet — the presentation already
 * established for every other panel in the app.
 *
 * The `variant` mirrors `GlobalActionButtons`: `pill` is the raised white
 * circle the desktop header uses against the aurora canvas, `bar` the flat
 * ghost button that sits level with its neighbours in the mobile top bar.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useNotifications } from '../NotificationContext'
import { NotificationPanel } from './NotificationPanel'
import type { Notification } from '../types'

/**
 * Unread count on the bell.
 *
 * `size-*` rather than an `h-N w-N` pair: the compact scale gives heights
 * their own tokens, so `h-4 w-4` would draw an ellipse. Caps at 9+ because
 * three digits stop being a number you read and start being a shape.
 */
function UnreadBadge({ count, variant }: { count: number; variant: 'pill' | 'bar' }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
        'bg-destructive text-white',
        variant === 'pill' ? 'top-1 right-1.5 h-4' : 'top-0.5 right-0.5 h-4',
      )}
      style={{ boxShadow: '0 0 0 2px var(--background)' }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export interface NotificationBellProps {
  variant?: 'pill' | 'bar'
}

export function NotificationBell({ variant = 'pill' }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  const shape =
    variant === 'pill'
      ? 'size-10 rounded-full bg-card border border-border shadow-sm'
      : 'size-10 rounded-lg hover:bg-muted'

  const handleNavigate = React.useCallback(
    (notification: Notification) => {
      setOpen(false)
      if (notification.target) navigate(notification.target.route)
    },
    [navigate],
  )

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', shape)}
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
      }
    >
      <Bell className="h-[18px] w-[18px] text-foreground" />
      {unreadCount > 0 && <UnreadBadge count={unreadCount} variant={variant} />}
      {/* The count is announced politely rather than through the label, so a
          notification arriving mid-task does not interrupt what is being read. */}
      <span aria-live="polite" className="sr-only">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
      </span>
    </Button>
  )

  if (isMobile) {
    return (
      <>
        {React.cloneElement(trigger, { onClick: () => setOpen(true) })}
        <Sheet open={open} onOpenChange={setOpen}>
          {/* The sheet's own close is suppressed — the panel header owns one,
              so the two never stack in the same corner. */}
          <SheetContent side="right" size="sm" className="gap-0 p-0 [&>button]:hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <NotificationPanel
              onNavigate={handleNavigate}
              onClose={() => setOpen(false)}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] max-w-[calc(100vw-2rem)] p-0"
      >
        <NotificationPanel onNavigate={handleNavigate} className="max-h-[min(32rem,70vh)]" />
      </PopoverContent>
    </Popover>
  )
}
