import * as React from 'react'
import { Calendar, Clock, MapPin, FileText, Link2, Users, Flag, Pencil, Trash2, ExternalLink, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { status, text, withOpacity } from '@/theme/colors'
import { categoryConfig } from '../utils/category-config'
import type { CalendarEventExtendedProps } from '../types'

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: status.success.base },
  medium: { label: 'Medium', color: status.warning.base },
  high: { label: 'High', color: status.danger.base },
}

interface ScheduleDetailCardProps {
  id: string
  title: string
  start: Date | string
  extendedProps: CalendarEventExtendedProps
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/**
 * Edit + delete, shared by the compact row and the stacked card so the delete
 * confirmation is written once.
 *
 * `inline` gives the two hover-target icon buttons the wide card has always
 * used. `menu` folds them behind one ⋯ button — what the compact row needs,
 * because two adjacent 24px buttons are neither tappable on their own nor
 * separable with `tap-area` overlays at zero gap, and one `tap-target` costs
 * the row 40px instead of 80.
 */
function CardActions({
  id,
  title,
  onEdit,
  onDelete,
  variant = 'inline',
}: Pick<ScheduleDetailCardProps, 'id' | 'title' | 'onEdit' | 'onDelete'> & {
  variant?: 'inline' | 'menu'
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete?.(id)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!onEdit && !onDelete) return null

  // Controlled rather than trigger-driven, so the same dialog serves the
  // buttons and the menu item without either fighting for focus on close.
  const confirmDialog = (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (variant === 'menu') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="tap-target h-7 w-7 -mt-1 -mr-1"
              aria-label={`Actions for ${title}`}
            >
              <MoreVertical className="h-4 w-4" style={{ color: 'var(--heading)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            // Closing the menu normally returns focus to its trigger, which
            // would yank it straight back out of the confirmation dialog the
            // Delete item just opened. Suppressed only in that case, so Escape
            // and outside-clicks still restore focus the usual way.
            onCloseAutoFocus={event => {
              if (confirmOpen) event.preventDefault()
            }}
          >
            {onEdit && (
              <DropdownMenuItem onSelect={() => onEdit(id)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
      </>
    )
  }

  return (
    <div className="flex items-center gap-0">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onEdit(id)}
          aria-label={`Edit ${title}`}
        >
          <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--heading-accent, var(--heading))' }} />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete ${title}`}
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--heading-accent, var(--heading))' }} />
        </Button>
      )}
      {confirmDialog}
    </div>
  )
}

export function ScheduleDetailCard({ id, title, start, extendedProps, onEdit, onDelete }: ScheduleDetailCardProps) {
  const { category, location, notes, startTimeDisplay, endTimeDisplay, description, link, attendees, priority } = extendedProps
  const config = categoryConfig[category]

  const dateObj = typeof start === 'string' ? new Date(start) : start
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const timeText = endTimeDisplay
    ? `${startTimeDisplay} – ${endTimeDisplay}`
    : startTimeDisplay

  const priorityInfo = priority ? PRIORITY_LABELS[priority] : null

  // Category · location · attendees, joined so the row keeps one meta line
  // instead of a stack of icon rows.
  const metaLine = [category, location, attendees].filter(Boolean).join(' · ')

  return (
    <>
      {/* ── Compact agenda row (below lg) ──────────────────────────────
          Desktop shows this in a narrow sticky column where stacking reads
          well. Full width on a phone that same stack ran 230–330px tall with
          the right half empty, so the row borrows the timetable's shape: a
          time rail, a tinted hairline, then title and meta. */}
      <div
        className="flex items-stretch gap-3 rounded-xl p-3 lg:hidden"
        style={{
          backgroundColor: withOpacity(config.backgroundColor, 0.14),
          border: `1px solid ${withOpacity(config.backgroundColor, 0.3)}`,
        }}
      >
        {/* Time rail — start over end, right-aligned against the divider so the
            numerals line up down the day, and top-aligned with the title.
            Priority sits under them: beside the title it stranded itself on a
            line of its own whenever the title wrapped, and as a right-hand
            column the widest label reserved ~100px the title needed. */}
        <div className="flex w-[62px] shrink-0 flex-col items-end pt-0.5">
          <span
            className="text-xs font-semibold leading-tight whitespace-nowrap"
            style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}
          >
            {startTimeDisplay}
          </span>
          {endTimeDisplay && (
            <span
              className="text-[10px] leading-tight whitespace-nowrap"
              style={{ color: text.muted, fontVariantNumeric: 'tabular-nums' }}
            >
              {endTimeDisplay}
            </span>
          )}
          {priorityInfo && (
            <span
              className="mt-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: 'var(--card)', color: priorityInfo.color }}
            >
              {priorityInfo.label}
            </span>
          )}
        </div>

        <span
          aria-hidden
          className="w-px self-stretch rounded-full"
          style={{ backgroundColor: config.borderColor, opacity: 0.5 }}
        />

        {/* Title + meta */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className="text-body font-semibold leading-tight break-words"
            style={{ color: 'var(--heading)' }}
          >
            {title}
          </span>
          {metaLine && (
            <span
              className="text-caption leading-tight break-words line-clamp-2"
              style={{ color: text.muted }}
            >
              {metaLine}
            </span>
          )}
          {(notes || description) && (
            <span
              className="text-caption leading-snug line-clamp-2"
              style={{ color: text.muted, opacity: 0.85 }}
            >
              {notes ?? description}
            </span>
          )}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex w-fit items-center gap-1 text-caption underline underline-offset-2"
              style={{ color: 'var(--heading)' }}
            >
              {link.replace(/^https?:\/\//, '').split('/')[0]}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          )}
        </div>

        {/* Right column — the overflow menu alone, so it costs the row one
            tap target's width and nothing more. */}
        <div className="flex shrink-0 items-start">
          <CardActions id={id} title={title} onEdit={onEdit} onDelete={onDelete} variant="menu" />
        </div>
      </div>

      {/* ── Stacked detail card (lg and up) ── */}
      <div
        className="hidden rounded-xl p-4 space-y-3 lg:block"
        style={{ backgroundColor: config.backgroundColor }}
      >
        {/* Header: Category badge + actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70"
              style={{ color: config.borderColor }}
            >
              {category}
            </span>
            {priorityInfo && (
              <span
                className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70"
                style={{ color: priorityInfo.color }}
              >
                <Flag className="w-2.5 h-2.5 inline mr-0.5" style={{ verticalAlign: '-1px' }} />
                {priorityInfo.label}
              </span>
            )}
          </div>
          <div className="-mt-0.5 -mr-1.5">
            <CardActions id={id} title={title} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>

        {/* Title */}
        <h4
          className="text-base font-bold leading-snug"
          style={{ color: 'var(--heading-accent, var(--heading))' }}
        >
          {title}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--heading-accent, var(--heading))', opacity: 0.7 }}>
            {description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heading-accent, var(--heading))' }}>
            <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heading-accent, var(--heading))' }}>
            <Clock className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span>{timeText}</span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heading-accent, var(--heading))' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span>{location}</span>
            </div>
          )}

          {attendees && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heading-accent, var(--heading))' }}>
              <Users className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span>{attendees}</span>
            </div>
          )}

          {link && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heading-accent, var(--heading))' }}>
              <Link2 className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80 flex items-center gap-1 truncate"
              >
                {link.replace(/^https?:\/\//, '').split('/')[0]}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="rounded-lg p-2.5 bg-white/40">
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" style={{ color: 'var(--heading-accent, var(--heading))' }} />
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--heading-accent, var(--heading))' }}>Notes</span>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--heading-accent, var(--heading))', opacity: 0.7 }}>
                  {notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
