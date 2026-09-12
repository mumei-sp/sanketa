import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PanelTile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { CalendarEvent } from '../types'

interface EventsListProps {
  events: CalendarEvent[]
  isLoading?: boolean
  embedded?: boolean
}

function EventsContent({ events }: { events: CalendarEvent[] }) {
  // Both callers — the rail's embedded list and the tablet tile — come through
  // here, so the empty month is answered once.
  if (events.length === 0) {
    return (
      <EmptyState
        title="Nothing scheduled"
        description="Events for this month appear here."
        className="py-8"
      />
    )
  }

  return (
    <div className="divide-y divide-border">
      {events.map(event => (
        <div key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-badge px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: event.bgColor,
                color: 'var(--heading-accent, var(--heading))',
              }}
            >
              {event.date}
            </span>
            <span className="text-caption text-muted-foreground">
              {event.startTime} - {event.endTime}
            </span>
          </div>
          {/* Two lines rather than an ellipsis. This rail is three columns wide
              on a desktop dashboard, and "English Literature Exam" is exactly the
              length that loses its last word — which is the word that says what
              the event is. A title is the row's whole point; the time and the
              audience below it can be the things that clip. */}
          <p
            className="text-body font-medium leading-snug line-clamp-2"
            style={{ color: 'var(--heading)' }}
            title={event.title}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-caption text-muted-foreground">{event.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EventsList({ events, isLoading = false, embedded = false }: EventsListProps) {
  if (isLoading && embedded) {
    return (
      <div className="px-4 pt-2 pb-0 space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <PanelTile id="events-tile">
        <Card className="pt-4 pb-4 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-2">
            <h3 className="text-section-title">Events</h3>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </PanelTile>
    )
  }

  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
          <h3 className="text-section-title">Events</h3>
        </div>
        <div className="px-4 flex-1 min-h-0 tile-list">
          <EventsContent events={events} />
        </div>
      </div>
    )
  }

  return (
    <PanelTile id="events-tile">
      <Card className="pt-4 pb-4 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">Events</h3>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 tile-list">
          <EventsContent events={events} />
        </CardContent>
      </Card>
    </PanelTile>
  )
}
