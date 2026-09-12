/**
 * Vidya Mandir's settings.
 *
 * Only what is genuinely a setting; see Kendriya's for why its sections are
 * no longer here. Twelve of them, and they live in `./academic.ts`.
 *
 * Twelve rather than Kendriya's nineteen is what a school of 317 runs: two
 * sections where the intake is heaviest and one everywhere else. It used to
 * run nineteen because the list was the app's and not the school's, and that
 * one inherited fact made classes of seventeen, nineteen timetables to staff
 * and a staff room of thirty-three — so the smaller school came out spending
 * more than the larger one.
 */

import type { SchoolConfig } from '@/config/school-config'

export const configFixture: Partial<SchoolConfig> = {
  schoolName: 'Vidya Mandir',
}
