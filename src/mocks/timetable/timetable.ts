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
import { tenantSections } from '@/mocks/tenants'
import { generateTimetables, generateExceptions } from './generate'

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

/** Look up subject by ID */
export function getSubjectById(id: string): Subject | undefined {
  return subjects.find(s => s.id === id)
}

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
export const classSections: ClassSection[] = tenantSections().map(section => ({
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

// ============================================================================
// Exceptions (deviations from normal schedule)
// ============================================================================

/** Substitutions, cancellations and extra classes — see `generate.ts`. */
export const timetableExceptions: TimetableException[] = generateExceptions(classTimetables)
