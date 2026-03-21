import type { EventInput } from '@fullcalendar/core'

export type EventCategory = 'Academic' | 'Events' | 'Finance' | 'Administration'

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export interface CategoryConfig {
  label: string
  backgroundColor: string
  borderColor: string
  textColor: string
  iconName: string
}

export type EventPriority = 'low' | 'medium' | 'high'
export type EventReminder = 'none' | '5min' | '15min' | '30min' | '1hr' | '1day'

export interface CalendarEventExtendedProps {
  category: EventCategory
  location?: string
  notes?: string
  startTimeDisplay: string
  endTimeDisplay: string
  description?: string
  link?: string
  isAllDay?: boolean
  attendees?: string
  priority?: EventPriority
  reminder?: EventReminder
}

export type CalendarEvent = EventInput & {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: CalendarEventExtendedProps
}
