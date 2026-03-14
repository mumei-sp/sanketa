/**
 * Calendar API Service
 *
 * Currently uses mock data. To connect to a backend:
 * 1. Replace the mock import with an API call (e.g., axios.get('/api/calendar/events'))
 * 2. Map the API response to CalendarEvent[] using mapApiEventToCalendarEvent()
 * 3. Remove the mock import and randomDelay()
 */
import { mockCalendarEvents } from '@/features/calendar/mocks'
import { categoryConfig } from '@/features/calendar/utils/category-config'
import type { CalendarEvent, EventCategory } from '@/features/calendar/types'

function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Fetch all calendar events.
 *
 * Backend replacement:
 *   const { data } = await axios.get('/api/calendar/events', { params: { start, end } })
 *   return data.map(mapApiEventToCalendarEvent)
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  await randomDelay()
  return [...mockCalendarEvents]
}

/**
 * Fetch calendar events filtered by category.
 *
 * Backend replacement:
 *   const { data } = await axios.get('/api/calendar/events', { params: { category } })
 *   return data.map(mapApiEventToCalendarEvent)
 */
export async function fetchCalendarEventsByCategory(
  category: EventCategory,
): Promise<CalendarEvent[]> {
  await randomDelay()
  return mockCalendarEvents.filter(e => e.extendedProps.category === category)
}

/**
 * Fetch calendar events within a date range.
 *
 * Backend replacement:
 *   const { data } = await axios.get('/api/calendar/events', { params: { start, end } })
 *   return data.map(mapApiEventToCalendarEvent)
 */
export async function fetchCalendarEventsByRange(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  await randomDelay()
  return mockCalendarEvents.filter(e => {
    const eventDate = e.start.split('T')[0]
    return eventDate >= startDate && eventDate <= endDate
  })
}

/**
 * Helper to map a raw API response object to a CalendarEvent.
 * Use this when connecting to a backend.
 *
 * Example API response shape:
 * {
 *   id: "evt-01",
 *   title: "Graphic Project Submission",
 *   category: "Academic",
 *   date: "2035-03-05",
 *   start_time: "09:00 AM",
 *   end_time: "10:00 AM",
 *   location: "Room 101",
 *   notes: "Submit all graphic design projects..."
 * }
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
