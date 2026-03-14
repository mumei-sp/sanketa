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

export interface CalendarEventExtendedProps {
  category: EventCategory
  location?: string
  notes?: string
  startTimeDisplay: string
  endTimeDisplay: string
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
