import { X } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScheduleDetailCard } from './ScheduleDetailCard'
import type { CalendarEvent } from '../types'

interface ScheduleDetailsProps {
  events: CalendarEvent[]
  selectedDate: Date | null
  onClose: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
  inline?: boolean
}

export function ScheduleDetails({
  events,
  selectedDate,
  onClose,
  onEdit,
  onDelete,
  className,
  inline,
}: ScheduleDetailsProps) {
  const content = events.length === 0 ? (
    <p className="text-sm text-muted-foreground text-center py-6">
      {selectedDate
        ? 'No events scheduled for this date.'
        : 'Select a date to view schedule details.'}
    </p>
  ) : (
    events.map(event => (
      <ScheduleDetailCard
        key={event.id}
        id={event.id}
        title={event.title}
        start={event.start}
        extendedProps={event.extendedProps}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))
  )

  // Inline mode: no Card wrapper, header + cards as flat elements
  if (inline) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--heading)' }}
          >
            Schedule Details
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
          {content}
        </div>
      </div>
    )
  }

  // Card mode: wrapped in a Card (for mobile)
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--heading)' }}
            >
              Schedule Details
            </h3>
            {/* The compact rows below drop the date — it belongs to the whole
                panel, not to each event, so it is stated once here. */}
            {selectedDate && (
              <p className="text-caption text-muted-foreground">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {content}
      </CardContent>
    </Card>
  )
}
