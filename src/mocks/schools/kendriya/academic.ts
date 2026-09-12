/**
 * Kendriya Vidyalaya's academic year.
 *
 * Nineteen sections across ten grades, and the ten subjects the app's
 * timetable is built around. Capacities sit a little above what each class
 * actually holds, which is what a school with room to admit looks like.
 */

import { generateAcademic } from '../_generate/academic'
import type { AcademicFixtures } from '@/mocks/tenant/academic/types'

export const academicFixtures: AcademicFixtures = generateAcademic({
  code: 'kendriya',
  yearStart: 2026,
  grades: [
    { grade: '1', sections: ['A', 'B'], capacity: 32 },
    { grade: '2', sections: ['A', 'B'], capacity: 32 },
    { grade: '3', sections: ['A'], capacity: 32 },
    { grade: '4', sections: ['A'], capacity: 32 },
    { grade: '5', sections: ['A', 'B'], capacity: 32 },
    { grade: '6', sections: ['A'], capacity: 30 },
    { grade: '7', sections: ['A', 'B', 'C'], capacity: 30 },
    { grade: '8', sections: ['A', 'B', 'C'], capacity: 30 },
    { grade: '9', sections: ['A', 'B'], capacity: 28 },
    { grade: '10', sections: ['A', 'B'], capacity: 28 },
  ],
  // Periods a week, junior (Classes 1–5) and senior (6–10). Both columns must
  // add to thirty — six periods over a five-day week — or the timetable is
  // asked for a week that does not exist. These used to be two constants
  // inside the timetable generator, which made a curriculum the app's opinion.
  subjects: [
    { name: 'Mathematics', code: 'math', subjectType: 'core', department: 'Mathematics', junior: 6, senior: 6 },
    { name: 'English', code: 'eng', subjectType: 'core', department: 'English', junior: 5, senior: 5 },
    { name: 'Science', code: 'sci', subjectType: 'core', department: 'Science', junior: 4, senior: 5 },
    { name: 'Social Studies', code: 'sst', subjectType: 'core', department: 'Social Studies', junior: 2, senior: 3 },
    { name: 'Hindi', code: 'hindi', subjectType: 'core', department: 'Hindi', junior: 3, senior: 3 },
    {
      name: 'Kannada',
      code: 'kannada',
      subjectType: 'core',
      // Karnataka requires the state language of every school in it, CBSE
      // included. Kendriya employed a teacher for it and had no period to put
      // her in, because the subject list was the app's.
      department: 'Kannada',
      junior: 3,
      senior: 2,
    },
    { name: 'Computer Science', code: 'cs', subjectType: 'core', department: 'Computer Science', junior: 0, senior: 2 },
    { name: 'Physical Education', code: 'pe', subjectType: 'core', department: 'Physical Education', junior: 3, senior: 2 },
    { name: 'Art', code: 'art', subjectType: 'elective', department: 'Art', junior: 2, senior: 0 },
    { name: 'Music', code: 'music', subjectType: 'elective', department: 'Music', junior: 1, senior: 1 },
    { name: 'Library', code: 'library', subjectType: 'extracurricular', department: 'Library', junior: 1, senior: 1 },
  ],
})
