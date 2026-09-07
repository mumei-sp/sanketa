/**
 * Calendar API Service
 *
 * Each public function pairs a mock path (in-memory mockCalendarEvents) with
 * an HTTP path (backend via apiClient). The env flag VITE_USE_MOCK_API picks
 * which runs at call time.
 */
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { mockCalendarEvents } from '@/mocks/calendar'
import { categoryConfig } from '@/features/calendar/utils/category-config'
import { background } from '@/theme/colors'
import type { CalendarEvent, EventCategory } from '@/features/calendar/types'
import type { EventFormValues } from '@/features/calendar/schemas/event-schema'

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Fetch all calendar events.
 *
 * @apiRoute GET /api/v1/calendar/events
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...mockCalendarEvents]
    },
    async () => {
      const { data } = await apiClient.get<CalendarEvent[]>('/calendar/events')
      return data
    },
  )
}

/**
 * Fetch calendar events filtered by category.
 *
 * @apiRoute GET /api/v1/calendar/events?category={category}
 */
export async function fetchCalendarEventsByCategory(
  category: EventCategory,
): Promise<CalendarEvent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockCalendarEvents.filter(e => e.extendedProps.category === category)
    },
    async () => {
      const { data } = await apiClient.get<CalendarEvent[]>('/calendar/events', {
        params: { category },
      })
      return data
    },
  )
}

/**
 * Fetch calendar events within a date range.
 *
 * @apiRoute GET /api/v1/calendar/events?start={startDate}&end={endDate}
 */
export async function fetchCalendarEventsByRange(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockCalendarEvents.filter(e => {
        const eventDate = e.start.split('T')[0]
        return eventDate >= startDate && eventDate <= endDate
      })
    },
    async () => {
      const { data } = await apiClient.get<CalendarEvent[]>('/calendar/events', {
        params: { start: startDate, end: endDate },
      })
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new calendar event from form values.
 *
 * @apiRoute POST /api/v1/calendar/events
 */
export async function createCalendarEvent(data: EventFormValues): Promise<CalendarEvent> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return formValuesToCalendarEvent(data)
    },
    async () => {
      const { data: created } = await apiClient.post<CalendarEvent>('/calendar/events', data)
      return created
    },
  )
}

/**
 * Update an existing calendar event by id.
 *
 * @apiRoute PUT /api/v1/calendar/events/{id}
 */
export async function updateCalendarEvent(
  id: string,
  data: EventFormValues,
): Promise<CalendarEvent> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return formValuesToCalendarEvent(data, id)
    },
    async () => {
      const { data: updated } = await apiClient.put<CalendarEvent>(`/calendar/events/${id}`, data)
      return updated
    },
  )
}

/**
 * Delete a calendar event by id.
 *
 * @apiRoute DELETE /api/v1/calendar/events/{id}
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency()
    },
    async () => {
      await apiClient.delete(`/calendar/events/${id}`)
    },
  )
}

// ---------------------------------------------------------------------------
// Pure format helpers (no network, no mocks) — exported so the calendar
// feature can marshal its own data without re-creating the translations.
// ---------------------------------------------------------------------------

/**
 * Helper to map a raw API response object to a CalendarEvent.
 * Use this when connecting to a backend that returns a different event shape.
 */
export function mapApiEventToCalendarEvent(apiEvent: {
  id: string
  title: string
  category: EventCategory
  date: string
  start_time: string
  end_time: string
  location?: string
  notes?: string
}): CalendarEvent {
  const config = categoryConfig[apiEvent.category]
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    start: `${apiEvent.date}T${convertTo24h(apiEvent.start_time)}`,
    end: `${apiEvent.date}T${convertTo24h(apiEvent.end_time)}`,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    textColor: config.textColor,
    extendedProps: {
      category: apiEvent.category,
      location: apiEvent.location,
      notes: apiEvent.notes,
      startTimeDisplay: apiEvent.start_time,
      endTimeDisplay: apiEvent.end_time,
    },
  }
}

function convertTo24h(time12h: string): string {
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (modifier === 'PM' && hours !== 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

function convertTo12h(time24h: string): string {
  const [h, m] = time24h.split(':').map(Number)
  const modifier = h >= 12 ? 'PM' : 'AM'
  const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hours12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${modifier}`
}

let nextId = 16

function formValuesToCalendarEvent(data: EventFormValues, id?: string): CalendarEvent {
  const category = data.category as EventCategory
  const config = categoryConfig[category]
  const eventId = id || `evt-${String(nextId++).padStart(2, '0')}`

  if (data.isAllDay) {
    return {
      id: eventId,
      title: data.title,
      start: data.date,
      end: data.date,
      allDay: true,
      backgroundColor: 'var(--heading)',
      borderColor: 'var(--heading)',
      textColor: background.card,
      extendedProps: {
        category,
        location: data.location || undefined,
        notes: data.notes || undefined,
        description: data.description || undefined,
        link: data.link || undefined,
        isAllDay: true,
        attendees: data.attendees || undefined,
        priority: data.priority,
        reminder: data.reminder,
        startTimeDisplay: 'All Day',
        endTimeDisplay: '',
      },
    }
  }

  const startTime = data.startTime || '09:00'
  const endTime = data.endTime || startTime
  const startDisplay = convertTo12h(startTime)
  const endDisplay = data.endTime ? convertTo12h(endTime) : ''

  return {
    id: eventId,
    title: data.title,
    start: `${data.date}T${startTime}:00`,
    end: `${data.date}T${endTime}:00`,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    textColor: config.textColor,
    extendedProps: {
      category,
      location: data.location || undefined,
      notes: data.notes || undefined,
      description: data.description || undefined,
      link: data.link || undefined,
      isAllDay: false,
      attendees: data.attendees || undefined,
      priority: data.priority,
      reminder: data.reminder,
      startTimeDisplay: startDisplay,
      endTimeDisplay: endDisplay,
    },
  }
}

export function calendarEventToFormValues(event: CalendarEvent): EventFormValues {
  const { extendedProps } = event
  const isAllDay = !!extendedProps.isAllDay || !!event.allDay

  let date = ''
  let startTime = ''
  let endTime = ''

  if (isAllDay) {
    date = typeof event.start === 'string' ? event.start.split('T')[0] : event.start
  } else {
    const startStr = typeof event.start === 'string' ? event.start : ''
    const endStr = typeof event.end === 'string' ? event.end : ''
    date = startStr.split('T')[0]
    startTime = startStr.includes('T') ? startStr.split('T')[1].substring(0, 5) : ''
    endTime = endStr.includes('T') ? endStr.split('T')[1].substring(0, 5) : ''
  }

  return {
    title: event.title,
    description: extendedProps.description || '',
    date,
    isAllDay,
    startTime,
    endTime,
    category: extendedProps.category,
    location: extendedProps.location || '',
    link: extendedProps.link || '',
    attendees: extendedProps.attendees || '',
    priority: extendedProps.priority || 'medium',
    reminder: extendedProps.reminder || 'none',
    notes: extendedProps.notes || '',
  }
}
