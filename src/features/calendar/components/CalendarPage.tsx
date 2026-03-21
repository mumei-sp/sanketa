import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TileWrapper, Tile } from '@/components/tile'
import { useIsDesktop } from '@/hooks/use-mobile'
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  calendarEventToFormValues,
} from '@/api/services/calendar-service'
import { CalendarCategoryTabs } from './CalendarCategoryTabs'
import { CalendarView } from './CalendarView'
import { ScheduleDetails } from './ScheduleDetails'
import { EventForm } from './EventForm'
import type { CalendarEvent, EventCategory } from '../types'
import type { EventFormValues } from '../schemas/event-schema'

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

  // CRUD state
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = React.useState<string>('')

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

  // ── CRUD handlers ──────────────────────────────────────────────────

  const handleAddAgenda = React.useCallback(() => {
    setEditingEvent(null)
    setDefaultDate('')
    setIsFormOpen(true)
  }, [])

  const handleDateClickCreate = React.useCallback((date: Date) => {
    // Also update selected date for sidebar
    setSelectedDate(date)
    setSelectedEvent(null)
    setShowDetails(true)
  }, [])

  const handleEditEvent = React.useCallback((id: string) => {
    const event = events.find(e => e.id === id)
    if (event) {
      setEditingEvent(event)
      setDefaultDate('')
      setIsFormOpen(true)
    }
  }, [events])

  const handleDeleteEvent = React.useCallback(async (id: string) => {
    await deleteCalendarEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
    // If the deleted event was selected, clear selection
    if (selectedEvent?.id === id) {
      setSelectedEvent(null)
    }
  }, [selectedEvent])

  const handleCreateEvent = React.useCallback(async (data: EventFormValues) => {
    const newEvent = await createCalendarEvent(data)
    setEvents(prev => [newEvent, ...prev])
    setIsFormOpen(false)
    // Select the new event
    setSelectedEvent(newEvent)
    setSelectedDate(new Date(newEvent.start))
    setShowDetails(true)
  }, [])

  const handleUpdateEvent = React.useCallback(async (data: EventFormValues) => {
    if (!editingEvent) return
    const updated = await updateCalendarEvent(editingEvent.id, data)
    setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e))
    setIsFormOpen(false)
    setEditingEvent(null)
    // Select the updated event
    setSelectedEvent(updated)
    setSelectedDate(new Date(updated.start))
    setShowDetails(true)
  }, [editingEvent])

  const handleFormClose = React.useCallback(() => {
    setIsFormOpen(false)
    setEditingEvent(null)
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
              onAddAgenda={handleAddAgenda}
            />
          </Tile>

          {showDetails && (
            <Tile id="schedule-details" width={{ lg: 1 }} className="sticky top-4">
              <ScheduleDetails
                events={detailEvents}
                selectedDate={selectedDate}
                onClose={handleCloseDetails}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
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
            onAddAgenda={handleAddAgenda}
          />

          {showDetails && (
            <ScheduleDetails
              events={detailEvents}
              selectedDate={selectedDate}
              onClose={handleCloseDetails}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          )}
        </div>
      )}

      {/* Create/Edit Event Sheet */}
      <Sheet open={isFormOpen} onOpenChange={open => { if (!open) handleFormClose() }}>
        <SheetContent side="right" size="full" className="p-0 w-full md:w-[calc(100vw-16rem)] [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</SheetTitle>
          </SheetHeader>
          {isFormOpen && (
            <EventForm
              key={editingEvent?.id || 'create'}
              onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
              onCancel={handleFormClose}
              initialData={editingEvent ? { ...calendarEventToFormValues(editingEvent), id: editingEvent.id } : undefined}
              defaultDate={defaultDate}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
