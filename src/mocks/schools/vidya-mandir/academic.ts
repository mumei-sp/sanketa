/**
 * Vidya Mandir's academic year.
 *
 * Twelve sections, and eleven subjects — the app's ten plus Kannada.
 *
 * ── The subject that could not exist ──────────────────────────────────
 * Karnataka's own language is taught in every school in the state, and this
 * one employs a teacher for it. While the subject list was the app's rather
 * than a school's, there was no slot in the timetable for her to teach in and
 * no mark sheet for her to fill: she appeared on the faculty list, in the
 * department table, in the payroll that sizes the ledger, and nowhere a child
 * would meet her.
 *
 * `subjects` being tenant data is what fixes that. A school teaches what it
 * teaches, and says so here.
 */

import { generateAcademic } from '../_generate/academic'
import type { AcademicFixtures } from '@/mocks/tenant/academic/types'

export const academicFixtures: AcademicFixtures = generateAcademic({
  code: 'vidya-mandir',
  yearStart: 2026,
  grades: [
    { grade: '1', sections: ['A', 'B'], capacity: 34 },
    { grade: '2', sections: ['A'], capacity: 34 },
    { grade: '3', sections: ['A'], capacity: 34 },
    { grade: '4', sections: ['A'], capacity: 34 },
    { grade: '5', sections: ['A'], capacity: 34 },
    { grade: '6', sections: ['A'], capacity: 32 },
    { grade: '7', sections: ['A'], capacity: 32 },
    { grade: '8', sections: ['A', 'B'], capacity: 32 },
    { grade: '9', sections: ['A'], capacity: 30 },
    { grade: '10', sections: ['A'], capacity: 30 },
  ],
  // Kannada takes four periods in the primary years and three after, and the
  // subjects around it give way — a week is thirty periods however many
  // languages a school teaches. Kendriya's Hindi-only week spends those on
  // English and Social Studies instead.
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
      department: 'Kannada',
      description: 'First language for most, second for children who join from out of state.',
      junior: 4,
      senior: 3,
    },
    { name: 'Computer Science', code: 'cs', subjectType: 'core', department: 'Computer Science', junior: 0, senior: 2 },
    { name: 'Physical Education', code: 'pe', subjectType: 'core', department: 'Physical Education', junior: 2, senior: 2 },
    { name: 'Art', code: 'art', subjectType: 'elective', department: 'Art', junior: 2, senior: 0 },
    { name: 'Music', code: 'music', subjectType: 'elective', department: 'Music', junior: 1, senior: 0 },
    { name: 'Library', code: 'library', subjectType: 'extracurricular', department: 'Library', junior: 1, senior: 1 },
  ],
})
