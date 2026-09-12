/**
 * Timetable Mock Data
 *
 * Contains subjects registry, class sections, weekly timetable templates,
 * and exception records. This file is the reference implementation for
 * the data model — backend should mirror these structures.
 *
 * Storage strategy: Template + Exception pattern
 * - Templates: one per class (weekly, ~30 slots each)
 * - Exceptions: only deviations from the norm (substitutions, cancellations)
 */

import { accent, primary, status, border } from '@/theme/colors'
// Brand base colors are CSS vars so subject tiles reflect the user's theme.
// Non-brand tokens (accent.soft, primary.soft, status.*, border.default) stay
// static — they're semantic/decorative, not user-tunable.
const BRAND_PRIMARY = 'var(--primary)'
const BRAND_ACCENT = 'var(--accent)'
// Mark imported values as used so lints don't flag them when specific
// variants (like .soft and .muted) stay bound.
void accent; void primary
import type {
  Subject,
  ClassSection,
  ClassTimetable,
  TimetableException,
} from '@/features/timetable/types'
import { sectionsAsConfig } from '@/mocks/tenant/academic'
import { generateTimetables, generateExceptions } from './generate'
import { replaceTimetable, listTimeSlots } from '@/mocks/tenant/scheduling/store'
import { currentYear, currentTerm } from '@/mocks/tenant/academic'

// ============================================================================
// Subjects Registry — colors from theme tokens, never hardcoded hex
// ============================================================================

// color-mix lets brand-derived shades track the user's active preset without
// us having to manage half a dozen extra CSS vars.
const PRIMARY_SOFT = 'color-mix(in srgb, var(--primary) 55%, white)'
const PRIMARY_MUTED = 'color-mix(in srgb, var(--primary) 30%, white)'
const ACCENT_SOFT = 'color-mix(in srgb, var(--accent) 55%, white)'
const ACCENT_MUTED = 'color-mix(in srgb, var(--accent) 30%, white)'
const ACCENT_SUBTLE = 'color-mix(in srgb, var(--accent) 20%, white)'

export const subjects: Subject[] = [
  { id: 'math',    name: 'Mathematics',        shortName: 'Math',    color: BRAND_ACCENT },
  { id: 'eng',     name: 'English',            shortName: 'Eng',     color: BRAND_PRIMARY },
  { id: 'sci',     name: 'Science',            shortName: 'Sci',     color: ACCENT_SOFT },
  { id: 'sst',     name: 'Social Studies',     shortName: 'SSt',     color: PRIMARY_SOFT },
  { id: 'hindi',   name: 'Hindi',              shortName: 'Hin',     color: status.success.soft },
  { id: 'cs',      name: 'Computer Science',   shortName: 'CS',      color: ACCENT_MUTED },
  { id: 'pe',      name: 'Physical Education', shortName: 'PE',      color: status.warning.soft },
  { id: 'art',     name: 'Art',                shortName: 'Art',     color: PRIMARY_MUTED },
  { id: 'music',   name: 'Music',              shortName: 'Mus',     color: ACCENT_SUBTLE },
  { id: 'library', name: 'Library',            shortName: 'Lib',     color: border.default },
]

// ============================================================================
// Class Sections
// ============================================================================

/**
 * The school's sections.
 *
 * From the school config, not a second copy of it. The copy that used to live
 * here held sixteen — it was missing 7B, 7C and 8C — so the timetable's class
 * picker silently omitted three sections that have students in them, and the
 * only symptom was a class you could not select.
 */
export const classSections: ClassSection[] = sectionsAsConfig().map(section => ({
  ...section,
}))

// ============================================================================
// Timetables — one per class, generated
// ============================================================================

/**
 * Every class's week.
 *
 * Generated rather than written out; `generate.ts` explains why, and what a
 * grid has to satisfy before it is a timetable rather than a table of
 * plausible cells. Mutable, because the timetable editor writes to it.
 */
export const classTimetables: ClassTimetable[] = generateTimetables()

/**
 * The same grid, as `timetable` rows.
 *
 * The nested shape above is what the screen renders; this is what the schema
 * has — one row per (section, slot, day), which is what its
 * `UNIQUE(class_section_id, time_slot_id, day_of_week, academic_year_id)`
 * constrains. Both are the same data, so it is projected rather than stated
 * twice.
 *
 * `day_of_week` is 1–7 with Monday at 1, as the schema has it; the grid counts
 * from 0. One of them had to convert and it is better done once, here, than
 * everywhere a row is read.
 */
replaceTimetable(
  (() => {
    // The slot's real id, not `slot-${periodId}`. Ids carry the school's
    // prefix — `vidya-mandir-slot-p1` — so building one by hand pointed every
    // one of 360 rows at a time slot that does not exist, at exactly one of
    // the two schools.
    const slotIdFor = new Map(
      listTimeSlots().map(slot => [slot.id.replace(/^.*slot-/, ''), slot.id]),
    )
    return classTimetables.flatMap(timetable =>
    timetable.slots.map(slot => ({
      id: `tt-${timetable.classSectionId}-${slot.periodId}-${slot.dayOfWeek}`,
      classSectionId: timetable.classSectionId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      timeSlotId: slotIdFor.get(slot.periodId) ?? slot.periodId,
      dayOfWeek: slot.dayOfWeek + 1,
      roomId: slot.roomId,
      academicYearId: currentYear()?.id ?? '',
      termId: currentTerm()?.id,
      isActive: true,
    })),
    )
  })(),
)

// ============================================================================
// Exceptions (deviations from normal schedule)
// ============================================================================

/** Substitutions, cancellations and extra classes — see `generate.ts`. */
export const timetableExceptions: TimetableException[] = generateExceptions(classTimetables)
