/**
 * The weekly timetable, for every class.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Three timetables — 9A, 8B and 7A — hand-written, thirty slots each, and
 * sixteen of the school's nineteen sections with none at all. The class picker
 * offered sixteen sections (it was missing 7B, 7C and 8C, which have students),
 * and choosing any of the thirteen without a template showed an empty week.
 *
 * The three that existed were staffed by five people: Ms. Lee, Mr. Roy, Ms.
 * Patel, Mr. Sharma and Mr. Shah, on ids `1` to `5`, none of them on the
 * faculty list and none of them plausible for the school. Ms. Lee taught
 * Mathematics and Computer Science to all three classes, in the same period,
 * on the same day, more than once — a timetable that could not be taught.
 *
 * ── What a timetable has to be ─────────────────────────────────────────
 * Two properties, and they are the whole difficulty:
 *
 * No teacher is in two rooms at once. That single constraint is what makes a
 * grid a timetable rather than a table of plausible cells, and it is what the
 * old fixture violated on nearly every row. It is also what forced the faculty
 * to grow — see `teachers/additional-faculty.ts`.
 *
 * One teacher per subject per class, all week. A class does not have five
 * different Mathematics teachers; it has one, and the same one appears in
 * every Mathematics cell of its week. Assigned per class before any placement,
 * which is also why placement can then fail: their week may already be full.
 *
 * ── Scarcest first ────────────────────────────────────────────────────
 * Placement runs subject by subject across the whole school, in order of how
 * thinly that department is staffed — the single librarian's nineteen periods
 * are placed before Mathematics' hundred and fourteen. Filling class-by-class
 * instead leaves the last classes asking for a teacher whose week is gone, and
 * a greedy pass has no way back.
 */

import type { ClassTimetable, TimetableSlot, TimetableException } from '@/features/timetable/types'
import {
  DEFAULT_PERIODS,
  DEFAULT_SCHOOL_DAYS,
  DEFAULT_SUBJECTS,
} from '@/config/school-config'
import { teachersData } from '@/mocks/teachers/teachers'
import { tenantSections } from '@/mocks/tenants'
import { departmentOf } from '@/mocks/teachers/assignments'
import { currentAcademicYear, academicYearStart, isoDate, relativeIso } from '@/mocks/_shared/date-helpers'
import { rng, int, pick } from '@/mocks/tenants/_generate/random'

const ACADEMIC_YEAR = currentAcademicYear()
const EFFECTIVE_FROM = isoDate(academicYearStart())

/** The teaching periods, in order. Breaks are not taught in. */
const TEACHING_PERIODS = DEFAULT_PERIODS.filter(period => !period.isBreak).map(period => period.id)
const DAYS = [...DEFAULT_SCHOOL_DAYS]

// ── Curriculum ────────────────────────────────────────────────────────

/**
 * Periods a week, per subject.
 *
 * Both add to thirty, which is what six periods over a five-day week gives —
 * a quota that does not add up leaves either empty cells or subjects that
 * cannot be placed. Juniors get more art, music and games and less of the
 * board subjects; seniors pick up Computer Science and drop Art. That is the
 * ordinary shape of an Indian school week.
 */
const JUNIOR_QUOTA: Readonly<Record<string, number>> = {
  math: 6, eng: 6, hindi: 4, sci: 4, sst: 2, art: 2, music: 2, pe: 3, library: 1,
}

const SENIOR_QUOTA: Readonly<Record<string, number>> = {
  math: 6, eng: 5, sci: 5, sst: 4, hindi: 4, cs: 2, pe: 2, music: 1, library: 1,
}

const quotaFor = (grade: string) => (Number(grade) <= 5 ? JUNIOR_QUOTA : SENIOR_QUOTA)

// ── Rooms ─────────────────────────────────────────────────────────────

/**
 * Where a period happens.
 *
 * A class has a home room it spends most of its week in, and the practical
 * subjects have theirs. A grid where every cell says "Room 201" is a grid
 * nobody has to read twice.
 */
function roomFor(subjectId: string, grade: string, section: string): string {
  switch (subjectId) {
    case 'sci':
      return `Lab ${((Number(grade) - 1) % 3) + 1}`
    case 'cs':
      return 'Computer Lab'
    case 'pe':
      return 'Ground'
    case 'art':
      return 'Art Room'
    case 'music':
      return 'Music Room'
    case 'library':
      return 'Library'
    default:
      return `Room ${grade}${section === 'A' ? '01' : section === 'B' ? '02' : '03'}`
  }
}

// ── Generation ────────────────────────────────────────────────────────

interface Placement {
  classKey: string
  slots: (TimetableSlot | null)[][]
}

/** Which teachers can take a subject, by the department their subject names. */
function facultyFor(subjectId: string) {
  const subject = DEFAULT_SUBJECTS.find(entry => entry.id === subjectId)
  if (!subject) return []
  return teachersData.filter(teacher => departmentOf(teacher.subject) === subject.name)
}

export function generateTimetables(): ClassTimetable[] {
  // No random source in here on purpose. Placement is a constraint problem,
  // not a sampling one — every choice is forced by what is already on the
  // grid — so the same faculty and the same quotas give the same week, and a
  // timetable bug is reproducible.

  // A teacher's week: which (day, period) pairs they are already teaching in.
  const teacherBusy = new Map<string, Set<string>>()
  const key = (day: number, period: string) => `${day}|${period}`
  const isFree = (teacherId: string, day: number, period: string) =>
    !teacherBusy.get(teacherId)?.has(key(day, period))
  const occupy = (teacherId: string, day: number, period: string) => {
    const week = teacherBusy.get(teacherId) ?? new Set<string>()
    week.add(key(day, period))
    teacherBusy.set(teacherId, week)
  }
  const release = (teacherId: string, day: number, period: string) => {
    teacherBusy.get(teacherId)?.delete(key(day, period))
  }

  const classes = tenantSections().map(section => ({
    ...section,
    quota: quotaFor(section.grade),
  }))

  // ── One teacher per subject per class ──
  // Periods promised to each teacher, counted as they are promised rather than
  // as they are placed. Without it every class in a subject is handed the same
  // teacher — their week is still empty at the moment of choosing, so "the
  // emptiest week" is a tie that the first row always wins, and eighteen of
  // nineteen grids then fail to place anything.
  const committed = new Map<string, number>()
  const promised = (teacherId: string) => committed.get(teacherId) ?? 0
  const assigned = new Map<string, (typeof teachersData)[number]>()
  const subjectIds = [...new Set(classes.flatMap(entry => Object.keys(entry.quota)))]

  // Scarcest department first — the librarian before the mathematicians.
  const scarcity = new Map(
    subjectIds.map(subjectId => {
      const faculty = facultyFor(subjectId)
      const demand = classes.reduce((sum, entry) => sum + (entry.quota[subjectId] ?? 0), 0)
      return [subjectId, faculty.length === 0 ? Infinity : demand / faculty.length]
    }),
  )
  const bySchedulingOrder = [...subjectIds].sort(
    (a, b) => (scarcity.get(b) ?? 0) - (scarcity.get(a) ?? 0),
  )

  bySchedulingOrder.forEach(subjectId => {
    const faculty = facultyFor(subjectId)
    classes.forEach(entry => {
      const periods = entry.quota[subjectId] ?? 0
      if (periods === 0 || faculty.length === 0) return
      // The teacher with the emptiest week, so the load spreads rather than
      // filling one person and then failing on the next class.
      const chosen = faculty.reduce((lightest, teacher) =>
        promised(teacher.teacherId) < promised(lightest.teacherId) ? teacher : lightest,
      )
      committed.set(chosen.teacherId, promised(chosen.teacherId) + periods)
      assigned.set(`${entry.label}|${subjectId}`, chosen)
    })
  })

  // ── Placement ──
  //
  // Cell by cell, not class by class. Every class needs a teacher in the same
  // thirty cells, and the thirty cells are the scarce thing — so the loop is
  // over cells, and at each one every class takes the subject it is furthest
  // behind on whose teacher happens to be free. Filling one class's whole week
  // before starting the next leaves the last classes asking for teachers whose
  // week is already gone, and a greedy pass has no way back: that left
  // fourteen of nineteen grids with holes in them.
  const grids = new Map<string, Placement>(
    classes.map(entry => [
      entry.label,
      {
        classKey: entry.label,
        slots: DAYS.map(() => TEACHING_PERIODS.map(() => null)),
      },
    ]),
  )

  /** Periods of each subject still owed to a class. */
  const owed = new Map<string, Map<string, number>>(
    classes.map(entry => [entry.label, new Map(Object.entries(entry.quota))]),
  )

  /** How many of this subject the class already has on this day. */
  const onDay = (grid: Placement, dayIndex: number, subjectId: string) =>
    grid.slots[dayIndex].filter(slot => slot?.subjectId === subjectId).length

  const cells = DAYS.flatMap((_, dayIndex) =>
    TEACHING_PERIODS.map((period, p) => ({ dayIndex, p, period })),
  )

  cells.forEach(({ dayIndex, p, period }, cellIndex) => {
    // Rotated, so the same class is not served first in every cell and left
    // with whatever nobody else wanted.
    const order = classes.map((_, i) => classes[(i + cellIndex) % classes.length])

    order.forEach(entry => {
      const grid = grids.get(entry.label)
      const remaining = owed.get(entry.label)
      if (!grid || !remaining || grid.slots[dayIndex][p] !== null) return

      const candidates = [...remaining.entries()]
        .filter(([, left]) => left > 0)
        .map(([subjectId, left]) => ({
          subjectId,
          left,
          teacher: assigned.get(`${entry.label}|${subjectId}`),
        }))
        .filter(candidate => !!candidate.teacher)
        // Furthest behind first: a subject owed six periods has to be placed
        // more eagerly than one owed one, or the ones owed most are the ones
        // left over at the end of the week.
        .sort((a, b) => b.left - a.left)

      // Each rule relaxed in turn, cheapest first. Spread through the week is
      // worth more than avoiding a double period, and both are worth more than
      // an empty cell, which the screen renders as a free period the school
      // does not give.
      const rules = [
        { maxPerDay: 1, allowConsecutive: false },
        { maxPerDay: 2, allowConsecutive: false },
        { maxPerDay: TEACHING_PERIODS.length, allowConsecutive: true },
      ]

      for (const { maxPerDay, allowConsecutive } of rules) {
        const chosen = candidates.find(candidate => {
          if (!candidate.teacher) return false
          if (onDay(grid, dayIndex, candidate.subjectId) >= maxPerDay) return false
          if (!allowConsecutive && grid.slots[dayIndex][p - 1]?.subjectId === candidate.subjectId) {
            return false
          }
          return isFree(candidate.teacher.teacherId, DAYS[dayIndex], period)
        })
        if (!chosen?.teacher) continue

        const subject = DEFAULT_SUBJECTS.find(one => one.id === chosen.subjectId)
        grid.slots[dayIndex][p] = {
          dayOfWeek: DAYS[dayIndex],
          periodId: period,
          subjectId: chosen.subjectId,
          subjectName: subject?.name ?? chosen.subjectId,
          teacherId: chosen.teacher.teacherId,
          teacherName: chosen.teacher.fullName ?? chosen.teacher.displayName ?? chosen.teacher.teacherId,
          room: roomFor(chosen.subjectId, entry.grade, entry.section),
        }
        occupy(chosen.teacher.teacherId, DAYS[dayIndex], period)
        remaining.set(chosen.subjectId, chosen.left - 1)
        return
      }

      // Nobody the class's own teachers could supply is free. Another teacher
      // of the same department takes it, which is what a head of department
      // arranges on a Monday morning — and is far better than a hole. It
      // costs the one-teacher-per-subject property for that single cell, so it
      // is the last thing tried rather than the first.
      for (const candidate of candidates) {
        const subject = DEFAULT_SUBJECTS.find(one => one.id === candidate.subjectId)
        const cover = facultyFor(candidate.subjectId).find(teacher =>
          isFree(teacher.teacherId, DAYS[dayIndex], period),
        )
        if (!subject || !cover) continue
        grid.slots[dayIndex][p] = {
          dayOfWeek: DAYS[dayIndex],
          periodId: period,
          subjectId: candidate.subjectId,
          subjectName: subject.name,
          teacherId: cover.teacherId,
          teacherName: cover.fullName ?? cover.displayName ?? cover.teacherId,
          room: roomFor(candidate.subjectId, entry.grade, entry.section),
        }
        occupy(cover.teacherId, DAYS[dayIndex], period)
        remaining.set(candidate.subjectId, candidate.left - 1)
        return
      }
    })
  })

  // ── Repair by swapping ──
  //
  // A few cells survive the pass: the class still owes a subject, and that
  // subject's teacher is teaching somebody else in exactly the cell that is
  // free. Hiring until that never happens would mean a staff room far larger
  // than a school of 441 has, and leaving the cell empty means the grid shows
  // a free period the school does not give.
  //
  // So swap. The hole is at one cell and the class's own week has thirty; if
  // some other cell holds a subject whose teacher is free at the hole, and the
  // owed subject's teacher is free at that other cell, the two exchange places
  // and both are still legal. This is the smallest piece of backtracking that
  // closes the endgame, and it is what a timetabler does by hand.
  classes.forEach(entry => {
    const grid = grids.get(entry.label)
    const remaining = owed.get(entry.label)
    if (!grid || !remaining) return

    grid.slots.forEach((day, dayIndex) => {
      day.forEach((slot, p) => {
        if (slot !== null) return
        const period = TEACHING_PERIODS[p]

        const stillOwed = [...remaining.entries()].filter(([, left]) => left > 0)
        for (const [subjectId] of stillOwed) {
          const teacher = assigned.get(`${entry.label}|${subjectId}`)
          const subject = DEFAULT_SUBJECTS.find(one => one.id === subjectId)
          if (!teacher || !subject) continue

          for (let d2 = 0; d2 < DAYS.length; d2 += 1) {
            for (let p2 = 0; p2 < TEACHING_PERIODS.length; p2 += 1) {
              const donor = grid.slots[d2][p2]
              if (!donor) continue
              const donorPeriod = TEACHING_PERIODS[p2]
              // The donor's teacher has to be able to take the hole, and ours
              // has to be able to take the donor's cell.
              if (!isFree(donor.teacherId, DAYS[dayIndex], period)) continue
              if (!isFree(teacher.teacherId, DAYS[d2], donorPeriod)) continue

              release(donor.teacherId, DAYS[d2], donorPeriod)
              grid.slots[dayIndex][p] = {
                ...donor,
                dayOfWeek: DAYS[dayIndex],
                periodId: period,
              }
              occupy(donor.teacherId, DAYS[dayIndex], period)

              grid.slots[d2][p2] = {
                dayOfWeek: DAYS[d2],
                periodId: donorPeriod,
                subjectId,
                subjectName: subject.name,
                teacherId: teacher.teacherId,
                teacherName: teacher.fullName ?? teacher.displayName ?? teacher.teacherId,
                room: roomFor(subjectId, entry.grade, entry.section),
              }
              occupy(teacher.teacherId, DAYS[d2], donorPeriod)
              remaining.set(subjectId, (remaining.get(subjectId) ?? 1) - 1)
              return
            }
          }
        }
      })
    })
  })

  return classes.map(entry => ({
    id: `tt-${entry.label.toLowerCase()}-${ACADEMIC_YEAR}`,
    classSectionId: entry.id,
    academicYear: ACADEMIC_YEAR,
    effectiveFrom: EFFECTIVE_FROM,
    slots: (grids.get(entry.label)?.slots ?? [])
      .flat()
      .filter((slot): slot is TimetableSlot => slot !== null),
  }))
}

// ── Exceptions ────────────────────────────────────────────────────────

const SUBSTITUTION_REASONS: readonly string[] = [
  'on medical leave',
  'at the district science exhibition',
  'attending the CBSE workshop',
  'on childcare leave',
]

const CANCELLATION_REASONS: readonly string[] = [
  'School assembly — Independence Day rehearsal',
  'Inter-house sports final',
  'Parent-teacher meeting slot',
  'Annual day rehearsal',
]

/**
 * The deviations — a substitution, a cancelled period, an extra revision class.
 *
 * Generated off the timetables so an exception refers to a period the class
 * actually has, and names a teacher who actually teaches it. The four
 * hand-written ones named Ms. Lee and Ms. Patel, who do not work here, and
 * two of them were on classes whose template was about to be regenerated
 * anyway.
 */
export function generateExceptions(timetables: ClassTimetable[]): TimetableException[] {
  const source = rng('timetable-exceptions:v1')
  const exceptions: TimetableException[] = []

  timetables.forEach(timetable => {
    // Most classes have had nothing unusual happen this fortnight.
    if (source() > 0.45) return
    const slot = pick(source, timetable.slots)
    if (!slot) return

    const roll = source()
    const dayOffset = int(source, -9, 4)

    if (roll < 0.5) {
      // A substitution keeps the subject and changes the teacher, so the
      // replacement has to be somebody who could actually take it.
      const cover = facultyFor(slot.subjectId).find(
        teacher => teacher.teacherId !== slot.teacherId,
      )
      if (!cover) return
      exceptions.push({
        id: `exc-${exceptions.length + 1}`,
        classSectionId: timetable.classSectionId,
        date: relativeIso(dayOffset),
        periodId: slot.periodId,
        type: 'substitution',
        originalSubject: slot.subjectName,
        originalTeacher: slot.teacherName,
        newSubject: slot.subjectName,
        newTeacher: cover.teacherId,
        newTeacherName: cover.fullName ?? cover.teacherId,
        reason: `${slot.teacherName} ${pick(source, SUBSTITUTION_REASONS)}`,
      })
    } else if (roll < 0.8) {
      exceptions.push({
        id: `exc-${exceptions.length + 1}`,
        classSectionId: timetable.classSectionId,
        date: relativeIso(dayOffset),
        periodId: slot.periodId,
        type: 'cancellation',
        originalSubject: slot.subjectName,
        originalTeacher: slot.teacherName,
        reason: pick(source, CANCELLATION_REASONS),
      })
    } else {
      exceptions.push({
        id: `exc-${exceptions.length + 1}`,
        classSectionId: timetable.classSectionId,
        // An extra class is arranged, so it is ahead of today.
        date: relativeIso(int(source, 1, 10)),
        periodId: slot.periodId,
        type: 'extra-class',
        newSubject: slot.subjectName,
        newTeacher: slot.teacherId,
        newTeacherName: slot.teacherName,
        reason: 'Extra revision class before the half yearly',
      })
    }
  })

  return exceptions
}
