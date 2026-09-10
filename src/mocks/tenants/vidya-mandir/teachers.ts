/**
 * Vidya Mandir's staff room.
 *
 * Generated end to end, and deliberately nobody Kendriya employs. A shared
 * faculty was the leak the tenant boundary exists to prevent, and the loudest
 * form of it: Priya Nair, teacher `T-1002`, took 9A Social Studies in Room 901
 * at both schools in the same period on the same day. One person, two
 * payrolls, two registers to sign at once.
 *
 * The ids say which school issued them — `VT-1001` here against Kendriya's
 * `T-1001`. Under schema-per-tenant both schools could legitimately issue
 * `T-1001` and overlapping ids would be the more faithful mock; distinct ones
 * are chosen because a leak across the boundary would then be silent, and this
 * file exists because one was.
 *
 * A smaller school, but not a smaller staff room: it runs the same nineteen
 * sections at six periods a day, so it owes the same 570 class-periods and
 * needs the same thirty-odd people. The classes are smaller, not fewer.
 */

import type { Teacher } from '@/features/teachers/types'
import { DEFAULT_CLASS_SECTIONS } from '@/config/school-config'
import { generateFaculty, dealSections } from '../_generate/faculty'

/** Vidya Mandir's own domain — a school's staff are on the school's mail. */
const VM_DOMAIN = 'vidyamandir.edu.in'

export const teacherFixtures: Teacher[] = dealSections(
  generateFaculty({
    code: 'vidya-mandir',
    codePrefix: 'VT',
    idPrefix: 'vm-t-',
    idBase: 1,
    emailDomain: VM_DOMAIN,
    phoneBase: 9482000000,
    // The whole staff, so every department the timetable draws on is covered.
    // Counted the same way as Kendriya's: the periods each department owes
    // across nineteen sections, over a teacher's week of about twenty-four.
    vacancies: [
      { subject: 'Mathematics', count: 5 },
      { subject: 'English Language', count: 3 },
      { subject: 'English Literature', count: 2 },
      { subject: 'Science - Biology', count: 2 },
      { subject: 'Science - Chemistry', count: 2 },
      { subject: 'Science - Physics', count: 1 },
      { subject: 'Social Studies - History', count: 2 },
      { subject: 'Social Studies - Civics', count: 2 },
      { subject: 'Hindi', count: 4 },
      { subject: 'Computer Science', count: 2 },
      { subject: 'Physical Education', count: 2 },
      { subject: 'Arts - Visual Arts', count: 1 },
      { subject: 'Arts - Music', count: 2 },
      { subject: 'Library', count: 1 },
      // Karnataka's own language, taught here as it is everywhere in the
      // state. Outside the timetable grid for now — the subject list the
      // timetable draws on is the app's ten, not a school's.
      { subject: 'Kannada', count: 2 },
    ],
  }),
  DEFAULT_CLASS_SECTIONS.map(section => section.label),
)
