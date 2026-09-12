/**
 * The active school's calendar.
 *
 * ── What moved out of here ─────────────────────────────────────────────
 * Fifteen occasions and the factories that shape them, all in one file and
 * all shared — so the same English Literature exam sat in Room 204 on the
 * same morning at both schools, and a school in Mysuru had no Dasara.
 *
 * The occasions are a school's own and live in its folder. The factories are
 * the app's, because the shape an event has to arrive in is FullCalendar's,
 * and they live in `schools/_generate/calendar.ts`.
 */

import type { CalendarEvent } from '@/features/calendar/types'
import { tenantFixtures } from '@/mocks/schools'
import { listCategories, replaceEvents } from '@/mocks/tenant/scheduling/store'
import type {
  CalendarEvent as SchedulingCalendarEvent,
  EventAttendee as SchedulingEventAttendee,
} from '@/mocks/tenant/scheduling/types'
import { teachersData } from '@/mocks/tenant/teachers/teachers'
import { currentYear, currentTerm } from '@/mocks/tenant/academic'

export const mockCalendarEvents: CalendarEvent[] = tenantFixtures().calendar.map(event => ({
  ...event,
  extendedProps: { ...event.extendedProps },
}))

/**
 * The same occasions, as `calendar_events` and `event_attendees` rows.
 *
 * FullCalendar's shape is the screen's: `start`, `backgroundColor`, everything
 * else bundled into `extendedProps`. The schema's is a table — a category it
 * points at, a room, a priority, a visibility, and who is invited. Both are the
 * same occasions, so this projects rather than stating them twice.
 *
 * ── Who is invited ────────────────────────────────────────────────────
 * `event_attendees` had no mock at all, so the RSVP the schema designs —
 * accepted, declined, tentative, still pending — was a table nothing had ever
 * written a row into.
 *
 * A staff meeting invites the teaching staff, which is who a staff meeting is
 * for. Drawing from the office accounts instead left Vidya Mandir's meetings
 * with nobody invited, because nobody there holds a staff account — true of
 * the accounts and untrue of the meeting.
 */
{
  const categories = listCategories()
  // The first few of the teaching staff. A whole-school briefing invites
  // everyone; a table with 31 rows per meeting demonstrates nothing that 8 do
  // not, and the mock is read by people.
  const invited = teachersData.slice(0, 8)
  const attendees: SchedulingEventAttendee[] = []

  const events: SchedulingCalendarEvent[] = mockCalendarEvents.map(event => {
    const props = event.extendedProps
    const category = categories.find(row => row.name === props?.category)
    const allDay = event.allDay === true

    // A meeting is the only kind anybody is asked to accept or decline. An
    // exam and a holiday happen whatever anyone answers.
    const isMeeting = props?.category === 'Administration'
    if (isMeeting) {
      invited.forEach((teacher, index) => {
        const roll = (event.id.length + index) % 4
        attendees.push({
          id: `att-${event.id}-${teacher.id}`,
          eventId: event.id,
          userId: String(teacher.id),
          role: index === 0 ? 'organizer' : 'required',
          responseStatus:
            index === 0 ? 'accepted' : roll === 0 ? 'pending' : roll === 1 ? 'tentative' : 'accepted',
          respondedAt: index === 0 ? event.start : undefined,
        })
      })
    }

    return {
      id: event.id,
      title: event.title,
      description: props?.description,
      eventType:
        props?.category === 'Academic' ? 'exam' : isMeeting ? 'meeting' : ('event' as const),
      categoryId: category?.id,
      startDatetime: event.start,
      endDatetime: event.end ?? event.start,
      isAllDay: allDay,
      location: props?.location,
      academicYearId: currentYear()?.id,
      termId: currentTerm()?.id,
      isMandatory: props?.priority === 'high',
      requiresAttendance: isMeeting,
      isOnline: Boolean(props?.link),
      meetingLink: props?.link,
      visibility: 'public' as const,
      // The office raises what goes on the school calendar.
      createdBy: '1',
      status: 'scheduled' as const,
      priority: props?.priority === 'high' ? 'high' : props?.priority === 'low' ? 'low' : 'normal',
      reminderMinutes: props?.reminder === '1day' ? 1440 : props?.reminder === '1hr' ? 60 : 15,
      isActive: true,
    }
  })

  replaceEvents(events, attendees)
}
