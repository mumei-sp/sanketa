import { Ellipsis, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { baseColors } from '@/theme/colors'
import type { CalendarEvent } from '../types'

interface EventsListProps {
  events: CalendarEvent[]
  isLoading?: boolean
  embedded?: boolean
}

function EventsContent({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="divide-y divide-border">
      {events.map(event => (
        <div key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-badge px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: event.bgColor,
                color: 'var(--heading)',
              }}
            >
              {event.date}
            </span>
            <span className="text-caption text-muted-foreground">
              {event.startTime} - {event.endTime}
            </span>
          </div>
          <p className="text-body font-medium truncate" style={{ color: 'var(--heading)' }}>
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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Tile id="events-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="pt-4 pb-4 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-2">
            <h3 className="text-section-title">Events</h3>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </Tile>
    )
  }

  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
          <h3 className="text-section-title">Events</h3>
          <button className="p-1 rounded-md hover:bg-accent transition-colors">
            <Ellipsis className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-4 overflow-y-auto flex-1 min-h-0">
          <EventsContent events={events} />
        </div>
      </div>
    )
  }

  return (
    <Tile id="events-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="pt-4 pb-4 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">Events</h3>
          <CardAction>
            <button className="p-1 rounded-md hover:bg-accent transition-colors">
              <Ellipsis className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0">
          <EventsContent events={events} />
        </CardContent>
      </Card>
    </Tile>
  )
}
