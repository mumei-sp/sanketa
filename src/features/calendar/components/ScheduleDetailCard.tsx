import * as React from 'react'
import { Calendar, Clock, MapPin, FileText, Link2, Users, Flag, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { status } from '@/theme/colors'
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

export function ScheduleDetailCard({ id, title, start, extendedProps, onEdit, onDelete }: ScheduleDetailCardProps) {
  const { category, location, notes, startTimeDisplay, endTimeDisplay, description, link, attendees, priority } = extendedProps
  const config = categoryConfig[category]
  const [isDeleting, setIsDeleting] = React.useState(false)

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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete?.(id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
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
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0 -mt-0.5 -mr-1.5">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEdit(id)}
              >
                <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--heading-accent, var(--heading))' }} />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--heading-accent, var(--heading))' }} />
                  </Button>
                </AlertDialogTrigger>
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
            )}
          </div>
        )}
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
  )
}
