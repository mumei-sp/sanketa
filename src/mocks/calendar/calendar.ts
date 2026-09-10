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
 * and they live in `tenants/_generate/calendar.ts`.
 */

import type { CalendarEvent } from '@/features/calendar/types'
import { tenantFixtures } from '@/mocks/tenants'

export const mockCalendarEvents: CalendarEvent[] = tenantFixtures().calendar.map(event => ({
  ...event,
  extendedProps: { ...event.extendedProps },
}))
