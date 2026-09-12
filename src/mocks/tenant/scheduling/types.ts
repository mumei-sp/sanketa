/**
 * `time-table` — when things happen, and where.
 *
 * Ported from `feature/db-schema:modules/time-table/schema.sql`. Postgres
 * enums become string unions and UUIDs become strings; nothing else is
 * reshaped.
 *
 * Named `scheduling/` rather than `timetable/` because there is already a
 * `tenant/timetable/` holding the grid the UI reads, and two folders a letter
 * apart is the trap `tenant/` and `tenants/` used to be.
 *
 * ── What a room being a string was costing ─────────────────────────────
 * A room was text on a slot — `'Lab 1'`, `'Ground'`, `'Room 901'`. Nothing
 * pointed at anything, so nothing could check, and nothing did: the generator
 * put **three classes in Lab 1 at once**, 57 times over at one school and 14
 * at the other. It refused to double-book a teacher and had no idea a room
 * could be double-booked at all.
 *
 * `rooms` with a `capacity` and a `room_type` is what makes that a question
 * with an answer.
 */

export type SlotType = 'class' | 'break' | 'lunch' | 'assembly' | 'free'
export type RoomType = 'classroom' | 'lab' | 'library' | 'auditorium' | 'gym' | 'office'
export type EventType = 'class' | 'exam' | 'meeting' | 'event' | 'holiday' | 'break'
export type EventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed'
export type EventPriority = 'low' | 'normal' | 'high' | 'urgent'
export type EventVisibility = 'public' | 'private' | 'class_only' | 'teachers_only'
export type AttendeeRole = 'organizer' | 'attendee' | 'optional' | 'required'
export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'tentative'

/**
 * One bell-to-bell span of the school day.
 *
 * The school's, not the app's. Period times were `DEFAULT_PERIODS` in the
 * shared config, so two schools in two cities rang the same bell at the same
 * minute — and a school that starts at 7:40 because of the commute had no way
 * to say so.
 */
export interface TimeSlot {
  id: string
  /** `Period 1`, `Lunch Break`. */
  name: string
  /** `08:00`. */
  startTime: string
  endTime: string
  slotType: SlotType
  academicYearId: string
  isActive: boolean
}

export interface Room {
  id: string
  /** `201`, `L1`. Unique within a building. */
  roomNumber: string
  roomName?: string
  building?: string
  floor?: number
  /** How many fit. A lab holds one class; a ground holds several. */
  capacity: number
  roomType: RoomType
  isActive: boolean
}

export interface CalendarCategory {
  id: string
  name: string
  /** Hex or a CSS variable — the app's palette, not the school's. */
  color: string
  icon?: string
  description?: string
  isActive: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  eventType: EventType
  categoryId?: string
  startDatetime: string
  endDatetime: string
  isAllDay: boolean
  location?: string
  roomId?: string
  /** Academic context — any of these may be absent for a whole-school event. */
  classSectionId?: string
  subjectId?: string
  teacherId?: string
  academicYearId?: string
  termId?: string
  maxAttendees?: number
  isMandatory: boolean
  requiresAttendance: boolean
  isOnline: boolean
  meetingLink?: string
  visibility: EventVisibility
  /** → the global `users.id`. */
  createdBy: string
  status: EventStatus
  priority: EventPriority
  reminderMinutes: number
  isActive: boolean
}

/**
 * One cell of the weekly grid.
 *
 * The schema's own comment calls these "weekly patterns that generate calendar
 * events", and `calendarEventId` is the link — a timetable row is the rule, an
 * event is one occurrence of it. The mock holds the rule; generating a term's
 * worth of occurrences from it is a backend job.
 *
 * `UNIQUE(class_section_id, time_slot_id, day_of_week, academic_year_id)` is
 * what stops a class being in two places at once. The teacher and room
 * constraints are not in the schema — they are the timetabler's job, and
 * `generate.ts` does that job.
 */
export interface TimetableEntry {
  id: string
  calendarEventId?: string
  classSectionId: string
  subjectId: string
  /** → `teachers.profile_id`. */
  teacherId: string
  timeSlotId: string
  /** 1 = Monday … 7 = Sunday, as the schema has it. */
  dayOfWeek: number
  roomId?: string
  academicYearId: string
  termId?: string
  isActive: boolean
}

export interface EventAttendee {
  id: string
  eventId: string
  /** → the global `users.id`. */
  userId: string
  role: AttendeeRole
  responseStatus: ResponseStatus
  responseNotes?: string
  respondedAt?: string
}

/** The six tables, written together and read together. */
export interface SchedulingFixtures {
  timeSlots: TimeSlot[]
  rooms: Room[]
  categories: CalendarCategory[]
  events: CalendarEvent[]
  timetable: TimetableEntry[]
  attendees: EventAttendee[]
}
