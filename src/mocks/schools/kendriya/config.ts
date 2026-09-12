/**
 * Kendriya Vidyalaya's own configuration.
 *
 * ── Why a school has one ───────────────────────────────────────────────
 * Class sections, the school's name, the subjects it teaches and the scale it
 * grades on are the school's data, not the app's. They were the app's: one
 * `DEFAULT_SCHOOL_CONFIG` and one `localStorage` key shared by both schools,
 * so renaming 8B at one school renamed it at the other, and Vidya Mandir ran
 * Kendriya's nineteen sections whether it had the children for them or not —
 * which is why a school of 317 needed a staff room of thirty-three.
 *
 * Only what differs from the app's defaults is stated here. Everything else —
 * the period times, the subject list, the CBSE grade scale — is the same at
 * both schools in this mock, and saying so by omission is more honest than
 * copying it twice.
 */

import type { SchoolConfig } from '@/config/school-config'

/** Nineteen sections: two or three in most grades, one in a few. */
export const classSections: SchoolConfig['classSections'] = [
  { id: 'cls-1a', grade: '1', section: 'A', label: '1A' },
  { id: 'cls-1b', grade: '1', section: 'B', label: '1B' },
  { id: 'cls-2a', grade: '2', section: 'A', label: '2A' },
  { id: 'cls-2b', grade: '2', section: 'B', label: '2B' },
  { id: 'cls-3a', grade: '3', section: 'A', label: '3A' },
  { id: 'cls-4a', grade: '4', section: 'A', label: '4A' },
  { id: 'cls-5a', grade: '5', section: 'A', label: '5A' },
  { id: 'cls-5b', grade: '5', section: 'B', label: '5B' },
  { id: 'cls-6a', grade: '6', section: 'A', label: '6A' },
  { id: 'cls-7a', grade: '7', section: 'A', label: '7A' },
  { id: 'cls-7b', grade: '7', section: 'B', label: '7B' },
  { id: 'cls-7c', grade: '7', section: 'C', label: '7C' },
  { id: 'cls-8a', grade: '8', section: 'A', label: '8A' },
  { id: 'cls-8b', grade: '8', section: 'B', label: '8B' },
  { id: 'cls-8c', grade: '8', section: 'C', label: '8C' },
  { id: 'cls-9a', grade: '9', section: 'A', label: '9A' },
  { id: 'cls-9b', grade: '9', section: 'B', label: '9B' },
  { id: 'cls-10a', grade: '10', section: 'A', label: '10A' },
  { id: 'cls-10b', grade: '10', section: 'B', label: '10B' },
]

export const configFixture: Partial<SchoolConfig> = {
  schoolName: 'Kendriya Vidyalaya',
  classSections,
}
