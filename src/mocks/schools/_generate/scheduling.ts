/**
 * A school's rooms and its bell.
 *
 * ── What a school states ──────────────────────────────────────────────
 * Its specialist rooms — how many labs, whether there is a second ground —
 * and when its periods run. Homerooms follow from the sections: every class
 * has one, numbered by floor the way school rooms are, so Class 9 B is in
 * Room 902.
 *
 * ── Why the counts matter ─────────────────────────────────────────────
 * A specialist room holds one class at a time, so the number of them is a
 * hard limit on how many classes can have that subject in the same period.
 * One computer lab means at most one class doing Computer Science at nine on
 * Monday. Getting this wrong does not produce an error — it produces a
 * timetable that cannot be taught, which is what the old string rooms did:
 * three classes in Lab 1, 57 times over.
 */

import type { Room, SlotType, TimeSlot } from '@/mocks/tenant/scheduling/types'

/** How many of each shared room the school has. */
export interface SpecialistRooms {
  /** Science practicals. */
  labs: number
  computerLabs: number
  artRooms: number
  musicRooms: number
  libraries: number
  /** Grounds and courts. Two classes of games at once needs two. */
  grounds: number
}

export interface SchedulingConfig {
  code: string
  academicYearId: string
  /** `[{ grade, section, label }]`, in teaching order. */
  sections: readonly { grade: string; section: string; label: string }[]
  rooms: SpecialistRooms
  /** The school day. `isBreak` slots are not taught in. */
  periods: readonly { id: string; label: string; startTime: string; endTime: string; isBreak: boolean }[]
}

/** Which room type a subject needs. Anything absent is taught in the homeroom. */
export const SPECIALIST_SUBJECTS: Readonly<Record<string, RoomTag>> = {
  cs: 'computer-lab',
  pe: 'ground',
  art: 'art-room',
  music: 'music-room',
  library: 'library',
}

export type RoomTag = 'homeroom' | 'lab' | 'computer-lab' | 'art-room' | 'music-room' | 'library' | 'ground'

/** The tag a room answers to, so the timetabler can ask for "a ground". */
export function tagOf(room: Room): RoomTag {
  if (room.roomType === 'library') return 'library'
  if (room.roomType === 'gym') return 'ground'
  if (room.roomType === 'lab') {
    if (room.roomName?.startsWith('Computer')) return 'computer-lab'
    return 'lab'
  }
  if (room.roomName === 'Art Room') return 'art-room'
  if (room.roomName === 'Music Room') return 'music-room'
  return 'homeroom'
}

export function generateScheduling(config: SchedulingConfig): {
  rooms: Room[]
  timeSlots: TimeSlot[]
} {
  const p = config.code === 'kendriya' ? '' : `${config.code}-`
  const rooms: Room[] = []

  // ── A homeroom per section ──
  // Numbered by grade and section the way a school numbers them: Class 9 B is
  // Room 902, which is the second room on the ninth floor's worth of numbering
  // — a convention, not a building with ten floors.
  config.sections.forEach(section => {
    const index = section.section.charCodeAt(0) - 64
    rooms.push({
      id: `${p}room-${section.label.toLowerCase()}`,
      roomNumber: `${section.grade}${String(index).padStart(2, '0')}`,
      roomName: `Class ${section.grade} ${section.section}`,
      building: 'Main Block',
      floor: Math.min(Number(section.grade), 4),
      // A homeroom seats its own class and a few visitors.
      capacity: 40,
      roomType: 'classroom',
      isActive: true,
    })
  })

  const add = (
    count: number,
    make: (n: number) => Omit<Room, 'id' | 'isActive'> & { idPart: string },
  ) => {
    for (let n = 1; n <= count; n += 1) {
      const { idPart, ...rest } = make(n)
      rooms.push({ id: `${p}room-${idPart}`, ...rest, isActive: true })
    }
  }

  add(config.rooms.labs, n => ({
    idPart: `lab-${n}`,
    roomNumber: `L${n}`,
    roomName: `Science Lab ${n}`,
    building: 'Science Block',
    floor: 1,
    capacity: 36,
    roomType: 'lab',
  }))
  add(config.rooms.computerLabs, n => ({
    idPart: `computer-lab-${n}`,
    roomNumber: `C${n}`,
    roomName: `Computer Lab ${n}`,
    building: 'Science Block',
    floor: 2,
    capacity: 36,
    roomType: 'lab',
  }))
  add(config.rooms.artRooms, n => ({
    idPart: `art-room-${n}`,
    roomNumber: `A${n}`,
    roomName: 'Art Room',
    building: 'Main Block',
    floor: 3,
    capacity: 34,
    roomType: 'classroom',
  }))
  add(config.rooms.musicRooms, n => ({
    idPart: `music-room-${n}`,
    roomNumber: `M${n}`,
    roomName: 'Music Room',
    building: 'Main Block',
    floor: 3,
    capacity: 34,
    roomType: 'classroom',
  }))
  add(config.rooms.libraries, n => ({
    idPart: `library-${n}`,
    roomNumber: `LIB${n}`,
    roomName: 'Library',
    building: 'Main Block',
    floor: 2,
    capacity: 60,
    roomType: 'library',
  }))
  add(config.rooms.grounds, n => ({
    idPart: `ground-${n}`,
    roomNumber: `G${n}`,
    roomName: n === 1 ? 'Main Ground' : `Court ${n - 1}`,
    building: 'Campus',
    capacity: 120,
    roomType: 'gym',
  }))

  const timeSlots: TimeSlot[] = config.periods.map(period => ({
    id: `${p}slot-${period.id}`,
    name: period.label,
    startTime: period.startTime,
    endTime: period.endTime,
    slotType: (period.isBreak
      ? period.label.toLowerCase().includes('lunch')
        ? 'lunch'
        : 'break'
      : 'class') as SlotType,
    academicYearId: config.academicYearId,
    isActive: true,
  }))

  return { rooms, timeSlots }
}
