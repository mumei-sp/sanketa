import type { AudienceReach } from '@/config/audience'
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
  /** Who is expected, as the school wrote it. What everyone reads. */
  attendees?: string
  /**
   * The same thing, in terms the app can match on. Absent means everybody —
   * see `config/audience.ts`.
   */
  reach?: AudienceReach
  priority?: EventPriority
  reminder?: EventReminder
  /**
   * Whether each family this reaches has to answer yes or no.
   *
   * A consent slip is not a thing of its own: it is an event that asks a
   * question. Putting the flag here rather than in a `consent_slips` table
   * means it inherits `reach` above — so "Class 9 parents" already works, and
   * `audienceReaches` decides who is asked, exactly as it decides who sees a
   * notice. A parallel table would have needed a second audience
   * implementation to go wrong independently of this one.
   *
   * The answers live in `mocks/tenant/consent`, keyed by event and student,
   * because that is the part that is per-child rather than per-event.
   */
  needsConsent?: boolean
  /** ISO date the school wants an answer by. Shown to the family, not enforced. */
  consentBy?: string
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
