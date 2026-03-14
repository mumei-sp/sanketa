import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { TileWrapper, Tile } from '@/components/tile'
import { useIsDesktop } from '@/hooks/use-mobile'
import { fetchCalendarEvents } from '@/api/services/calendar-service'
import { CalendarCategoryTabs } from './CalendarCategoryTabs'
import { CalendarView } from './CalendarView'
import { ScheduleDetails } from './ScheduleDetails'
import type { CalendarEvent, EventCategory } from '../types'

export function CalendarPage() {
  const isDesktop = useIsDesktop()

  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<EventCategory | 'all'>('all')
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    () => new Date(2035, 2, 12), // Default to Mar 12 (English Lit Exam + Parent-Teacher Meeting)
  )
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [showDetails, setShowDetails] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const data = await fetchCalendarEvents()
        setEvents(data)
      } catch (error) {
        console.error('Failed to fetch calendar events:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredEvents = React.useMemo(() => {
    if (selectedCategory === 'all') return events
    return events.filter(e => e.extendedProps.category === selectedCategory)
  }, [events, selectedCategory])

  const handleEventClick = React.useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(new Date(event.start))
    setShowDetails(true)
  }, [])

  const handleDateClick = React.useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setShowDetails(true)
  }, [])

  const handleCloseDetails = React.useCallback(() => {
    setShowDetails(false)
    setSelectedEvent(null)
  }, [])

  // Events for the schedule details sidebar
  const detailEvents = React.useMemo(() => {
    if (selectedEvent) {
      return [selectedEvent]
    }
    if (selectedDate) {
      return filteredEvents.filter(e => {
        const eventDate = new Date(e.start)
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        )
      })
    }
    return []
  }, [selectedEvent, selectedDate, filteredEvents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Calendar"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
        />
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-36 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Calendar"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
      />

      {/* Category filter tabs */}
      <CalendarCategoryTabs
        events={events}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main content: Calendar + Schedule Details */}
      {isDesktop ? (
        <TileWrapper columns={{ default: 1, lg: 5 }} gap={12}>
          <Tile id="calendar-grid" width={{ lg: showDetails ? 4 : 5 }}>
            <CalendarView
              events={filteredEvents}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </Tile>

          {showDetails && (
            <Tile id="schedule-details" width={{ lg: 1 }} className="sticky top-4">
              <ScheduleDetails
                events={detailEvents}
                selectedDate={selectedDate}
                onClose={handleCloseDetails}
                inline
              />
            </Tile>
          )}
        </TileWrapper>
      ) : (
        <div className="space-y-4">
          <CalendarView
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />

          {showDetails && (
            <ScheduleDetails
              events={detailEvents}
              selectedDate={selectedDate}
              onClose={handleCloseDetails}
            />
          )}
        </div>
      )}
    </div>
  )
}
