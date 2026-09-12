/**
 * Which department a teacher's subject belongs to.
 *
 * The faculty list is specific — 'Science - Biology', 'English Literature',
 * 'Arts - Music' — and the school's subject list is not: 'Science', 'English',
 * 'Music'. So a teacher is placed in the configured subject their own subject
 * mentions, longest match first, because 'Arts - Music' mentions both Art and
 * Music and the music teacher belongs to Music.
 *
 * A subject the school does not configure — Kannada, Urdu — is its own
 * department, which is the truth about a school of this size: one teacher, one
 * language, no department above them.
 *
 * ── Why it lives alone ─────────────────────────────────────────────────
 * It is a pure function of a string, and the profiles store needs it: a
 * teacher's `staff` row carries their department, and that row is written
 * where the profiles are seeded. Left in `assignments.ts` it would have
 * dragged `teachersData` and the academic store in behind it, which is the
 * import cycle the store rule exists to prevent.
 */

import { DEFAULT_SUBJECTS } from '@/config/school-config'

export function departmentOf(subject: string): string {
  const matches = DEFAULT_SUBJECTS.map(entry => entry.name).filter(name =>
    subject.toLowerCase().includes(name.toLowerCase()),
  )
  if (matches.length > 0) {
    return matches.reduce((longest, name) => (name.length > longest.length ? name : longest))
  }
  return subject.split(' - ')[0].trim()
}
