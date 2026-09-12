/**
 * vidya-mandir — its rooms and its bell.
 *
 * Twelve sections and a smaller campus: one ground is enough, because at most one class has games in any period.
 *
 * A specialist room holds one class at a time, so these counts are a hard
 * limit on how many classes can take that subject in the same period. See
 * `../_generate/scheduling.ts`.
 */

import { generateScheduling } from '../_generate/scheduling'
import { sectionLabels } from '../_generate/academic'
import { academicFixtures } from './academic'
import { DEFAULT_PERIODS } from '@/config/school-config'

export const schedulingFixtures = generateScheduling({
  code: 'vidya-mandir',
  academicYearId: academicFixtures.years[0].id,
  sections: sectionLabels(academicFixtures),
  rooms: {
    labs: 2,
    computerLabs: 1,
    artRooms: 1,
    musicRooms: 1,
    libraries: 1,
    grounds: 1,
  },
  // The app's six periods and two breaks, for now. They are a *school's*
  // bell — a school that starts at 7:40 because of the commute should say so
  // here — and `time_slots` is the table that finally lets it.
  periods: DEFAULT_PERIODS,
})
