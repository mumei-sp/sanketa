/** Mock data for Special Programs / Scholarships widget on Students page */

import type { SpecialProgramEntry } from '@/features/students/types'

export const specialProgramsData: SpecialProgramEntry[] = [
  {
    id: 'sp-1',
    name: 'Fatima Noor',
    studentId: 'S-2021',
    classLabel: '7C',
    categories: ['Enrichment'],
    program: 'Community Leadership Fellowship',
    avatarColor: '#FECCFD',
  },
  {
    id: 'sp-2',
    name: 'Alicia Gomez',
    studentId: 'S-2033',
    classLabel: '9A',
    categories: ['Academic Support'],
    program: 'National Science Scholarship',
    avatarColor: '#CDEAF0',
  },
  {
    id: 'sp-3',
    name: 'Daniel Park',
    studentId: 'S-2041',
    classLabel: '8A',
    categories: ['Finance', 'Enrichment'],
    program: 'Student Athlete Sponsorship',
    avatarColor: '#C7E5C8',
  },
  {
    id: 'sp-4',
    name: 'Leo Ricci',
    studentId: 'S-2026',
    classLabel: '8C',
    categories: ['Enrichment'],
    program: 'Arts & Creative Talent Grant',
    avatarColor: '#FFE5B4',
  },
  {
    id: 'sp-5',
    name: 'Naomi Hayes',
    studentId: 'S-2038',
    classLabel: '9B',
    categories: ['Enrichment'],
    program: 'Community Leadership Fellowship',
    avatarColor: '#E8D5F5',
  },
]
