/**
 * Vidya Mandir's own configuration.
 *
 * ── Twelve sections, not nineteen ──────────────────────────────────────
 * It used to run Kendriya's nineteen, because the section list was the app's
 * and not the school's. That single inherited fact made everything downstream
 * wrong in the same direction: 317 children spread across nineteen sections
 * is classes of seventeen, nineteen timetables to staff, and therefore a
 * staff room of thirty-three for a school two-thirds the size of one with
 * thirty-one. The smaller school came out spending more.
 *
 * Twelve is what a school this size actually runs: two sections where the
 * intake is heaviest and one everywhere else, at twenty-five or so a class.
 */

import type { SchoolConfig } from '@/config/school-config'

export const classSections: SchoolConfig['classSections'] = [
  { id: 'cls-1a', grade: '1', section: 'A', label: '1A' },
  { id: 'cls-1b', grade: '1', section: 'B', label: '1B' },
  { id: 'cls-2a', grade: '2', section: 'A', label: '2A' },
  { id: 'cls-3a', grade: '3', section: 'A', label: '3A' },
  { id: 'cls-4a', grade: '4', section: 'A', label: '4A' },
  { id: 'cls-5a', grade: '5', section: 'A', label: '5A' },
  { id: 'cls-6a', grade: '6', section: 'A', label: '6A' },
  { id: 'cls-7a', grade: '7', section: 'A', label: '7A' },
  { id: 'cls-8a', grade: '8', section: 'A', label: '8A' },
  { id: 'cls-8b', grade: '8', section: 'B', label: '8B' },
  { id: 'cls-9a', grade: '9', section: 'A', label: '9A' },
  { id: 'cls-10a', grade: '10', section: 'A', label: '10A' },
]

export const configFixture: Partial<SchoolConfig> = {
  schoolName: 'Vidya Mandir',
  classSections,
}
