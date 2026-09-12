/**
 * `time-table` — the school's rooms, its bell, and what happens in them.
 *
 * Six tables in one key. A timetable row is meaningless without the time slot
 * and room it names, so they are written together and read together.
 *
 * ── Seeded in two halves ──────────────────────────────────────────────
 * The rooms and the bell come from the school's folder. The timetable rows and
 * the calendar events are *produced* — by the timetabler in
 * `tenant/timetable/generate.ts` and from the school's own calendar fixture —
 * and handed here, because both need the rooms this store holds and neither
 * can be stated by hand for 570 cells.
 */

import { seedSignature } from '@/mocks/_shared/seed-signature'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { tenantFixtures } from '@/mocks/schools'
import type {
  CalendarCategory,
  CalendarEvent,
  EventAttendee,
  Room,
  SchedulingFixtures,
  TimeSlot,
  TimetableEntry,
} from './types'

export type * from './types'

const TABLE = 'scheduling'

interface Database extends SchedulingFixtures {
  seed?: string
}

let db: Database | null = null

onTenantSwitch(() => {
  db = null
})

function signatureOf(): string {
  const { rooms, timeSlots } = tenantFixtures().scheduling
  return seedSignature([rooms, timeSlots])
}

/**
 * The categories an event can be filed under.
 *
 * The app's, not a school's: these are the colours and icons the calendar
 * renders with, and a school has no opinion about the hue of "Academic". A
 * school naming its own would be a real feature, and this is the table it
 * would live in.
 */
const BUILTIN_CATEGORIES: Omit<CalendarCategory, 'id'>[] = [
  { name: 'Academic', color: 'var(--primary)', icon: 'graduation-cap', isActive: true },
  { name: 'Events', color: 'var(--accent)', icon: 'calendar-days', isActive: true },
  { name: 'Finance', color: 'var(--heading)', icon: 'wallet', isActive: true },
  { name: 'Administration', color: 'var(--muted-foreground)', icon: 'briefcase', isActive: true },
]

function seed(): Database {
  const fixtures = tenantFixtures().scheduling
  return {
    timeSlots: fixtures.timeSlots.map(row => ({ ...row })),
    rooms: fixtures.rooms.map(row => ({ ...row })),
    categories: BUILTIN_CATEGORIES.map(category => ({
      ...category,
      id: `cat-${category.name.toLowerCase()}`,
    })),
    // Filled by the timetabler and the calendar seed — see the note above.
    events: [],
    timetable: [],
    attendees: [],
    seed: signatureOf(),
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (
        Array.isArray(parsed.rooms) &&
        Array.isArray(parsed.timeSlots) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.events) &&
        Array.isArray(parsed.timetable) &&
        Array.isArray(parsed.attendees) &&
        parsed.seed === signatureOf()
      ) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }
  db = seed()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(tenantKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

// ── Reads ─────────────────────────────────────────────────────────────

/** The taught periods, in order. Breaks are not taught in. */
export function listTeachingSlots(): TimeSlot[] {
  return load().timeSlots.filter(slot => slot.slotType === 'class' && slot.isActive)
}

export function listTimeSlots(): TimeSlot[] {
  return load().timeSlots.map(row => ({ ...row }))
}

export function listRooms(): Room[] {
  return load().rooms.filter(row => row.isActive).map(row => ({ ...row }))
}

export function findRoom(id: string): Room | undefined {
  const found = load().rooms.find(row => row.id === id)
  return found ? { ...found } : undefined
}

/** `Science Lab 2`, or the room number when it has no name. */
export function roomLabel(id: string | undefined): string | undefined {
  if (!id) return undefined
  const room = findRoom(id)
  return room ? (room.roomName ?? `Room ${room.roomNumber}`) : undefined
}

export function listCategories(): CalendarCategory[] {
  return load().categories.map(row => ({ ...row }))
}

export function listTimetable(): TimetableEntry[] {
  return load().timetable.map(row => ({ ...row }))
}

export function listEvents(): CalendarEvent[] {
  return load().events.filter(row => row.isActive).map(row => ({ ...row }))
}

export function attendeesOf(eventId: string): EventAttendee[] {
  return load()
    .attendees.filter(row => row.eventId === eventId)
    .map(row => ({ ...row }))
}

// ── Writes ────────────────────────────────────────────────────────────

/** The timetabler hands over a term's grid in one go. */
export function replaceTimetable(entries: TimetableEntry[]): void {
  load().timetable = entries.map(row => ({ ...row }))
  persist()
}

export function replaceEvents(events: CalendarEvent[], attendees: EventAttendee[] = []): void {
  const database = load()
  database.events = events.map(row => ({ ...row }))
  database.attendees = attendees.map(row => ({ ...row }))
  persist()
}
