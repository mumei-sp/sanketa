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
 * A smaller staff room, because it is a smaller school in the way that
 * matters: twelve sections rather than nineteen. Twelve at six periods over
 * five days is 360 class-periods, and a teacher takes about twenty-four a
 * week — so about twenty people, not thirty-three.
 *
 * It ran nineteen sections until the class list became the school's own
 * rather than the app's. That one inherited fact made a school of 317 need
 * the staff of a school of 441, and come out spending more than it.
 */

import type { Teacher } from '@/features/teachers/types'
import { classSections } from './config'
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
      { subject: 'Mathematics', count: 3 },
      { subject: 'English Language', count: 2 },
      { subject: 'English Literature', count: 1 },
      { subject: 'Science - Biology', count: 2 },
      { subject: 'Science - Chemistry', count: 1 },
      { subject: 'Social Studies - History', count: 1 },
      { subject: 'Social Studies - Civics', count: 1 },
      { subject: 'Hindi', count: 3 },
      { subject: 'Computer Science', count: 1 },
      { subject: 'Physical Education', count: 2 },
      { subject: 'Arts - Visual Arts', count: 1 },
      { subject: 'Arts - Music', count: 1 },
      { subject: 'Library', count: 1 },
      // Karnataka's own language, taught here as it is everywhere in the
      // state. Outside the timetable grid for now — the subject list the
      // timetable draws on is the app's ten, not a school's.
      { subject: 'Kannada', count: 1 },
    ],
  }),
  classSections.map(section => section.label),
)
