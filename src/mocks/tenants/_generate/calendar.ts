/**
 * Making a calendar event.
 *
 * ── Why the factories are here ─────────────────────────────────────────
 * The events themselves are a school's own — its exam dates, its staff
 * meetings, its Dasara holidays — but the shape they have to arrive in is
 * FullCalendar's, and that is the app's business. So the schools state
 * occasions and this turns them into events.
 *
 * Shared, the calendar showed the same fifteen occasions at both schools:
 * the same English Literature exam in Room 204 on the same morning at a
 * school in Bangalore and a school in Mysuru.
 */

import { categoryConfig } from '@/features/calendar/utils/category-config'
import { background } from '@/theme/colors'
import type {
  CalendarEvent,
  EventCategory,
  EventPriority,
  EventReminder,
} from '@/features/calendar/types'

export function calDay(day: number): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-${String(day).padStart(2, '0')}`
}

/**
 * Convert 12-hour time string to 24-hour ISO format
 */
function to24h(time12h: string): string {
  const [time, modifier] = time12h.split(' ')
  // Split rather than destructured: `hours` is reassigned below and `minutes`
  // is not, and one `let [a, b]` cannot say that.
  const [rawHours, minutes] = time.split(':').map(Number)
  let hours = rawHours
  if (modifier === 'PM' && hours !== 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

interface EventExtras {
  description?: string
  link?: string
  attendees?: string
  priority?: EventPriority
  reminder?: EventReminder
}

/**
 * Factory to create a FullCalendar-compatible event from simple inputs.
 * When swapping to a backend, replace this with API response mapping.
 */
export function createEvent(
  id: string,
  title: string,
  category: EventCategory,
  date: string,
  startTime: string,
  endTime?: string,
  location?: string,
  notes?: string,
  extras?: EventExtras,
): CalendarEvent {
  const config = categoryConfig[category]
  return {
    id,
    title,
    start: `${date}T${to24h(startTime)}`,
    end: endTime ? `${date}T${to24h(endTime)}` : `${date}T${to24h(startTime)}`,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    // Pill backgrounds stay pastel in both modes, so lock text to the
    // user-picked heading color (which remains dark in dark mode).
    textColor: 'var(--heading-accent, var(--heading))',
    extendedProps: {
      category,
      location,
      notes,
      startTimeDisplay: startTime,
      endTimeDisplay: endTime || '',
      description: extras?.description,
      link: extras?.link,
      attendees: extras?.attendees,
      priority: extras?.priority,
      reminder: extras?.reminder,
    },
  }
}

/**
 * Factory for all-day events (e.g. deadlines).
 * Uses the category's borderColor as the block background for a bold look.
 */
export function createAllDayEvent(
  id: string,
  title: string,
  category: EventCategory,
  date: string,
  location?: string,
  notes?: string,
  extras?: EventExtras,
): CalendarEvent {
  return {
    id,
    title,
    start: date,
    end: date,
    allDay: true,
    backgroundColor: 'var(--heading)',
    borderColor: 'var(--heading)',
    textColor: background.card,
    extendedProps: {
      category,
      location,
      notes,
      startTimeDisplay: 'All Day',
      endTimeDisplay: '',
      isAllDay: true,
      description: extras?.description,
      link: extras?.link,
      attendees: extras?.attendees,
      priority: extras?.priority,
      reminder: extras?.reminder,
    },
  }
}
