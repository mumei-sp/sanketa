/**
 * Vidya Mandir's roster.
 *
 * A smaller school in a different city, generated from the same machinery as
 * Kendriya's with a different seed — so it is a genuinely different set of
 * families, not Kendriya's first three hundred with the ids changed. Its
 * classes are the same labels, which is the collision the tenant boundary has
 * to survive: a teacher scoped to `8A` at one school must not read `8A` here.
 *
 * ── The one that is written out ────────────────────────────────────────
 * Ira Sharma's father is Rohan Sharma on 9845123457 — the same human as
 * Kendriya's first parent, on the same number. One father, two schools, one
 * login: the case the global identity tables exist for, and the one that would
 * silently stop being tested if this row drifted.
 *
 * Families are Mysuru families, on Mysuru addresses. That is not decoration:
 * a second school whose students all live in Bangalore localities reads as one
 * school's data copied twice, which is exactly what the boundary is supposed
 * to make impossible.
 */

import type { Student } from '@/features/students/types'
import { DEFAULT_CLASS_SECTIONS } from '@/config/school-config'
import { generateRoster, MYSURU } from '../_generate'

const anchors: Student[] = [
  {
    id: 'vm-1',
    userId: 5001,
    profileType: 0,
    firstName: 'Ira',
    lastName: 'Sharma',
    fullName: 'Ira Sharma',
    displayName: 'Ira Sharma',
    preferredName: 'Ira',
    name: 'Ira Sharma',
    dateOfBirth: '2013-02-11',
    gender: 1,
    primaryPhone: '9845123458',
    phoneCountryCode: '+91',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ira%20Sharma',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ira%20Sharma',
    address: '18, 3rd Cross, Saraswathipuram, Mysuru, Karnataka 570009, India',
    studentId: 'VM-3001',
    admissionNumber: 'VM-ADM-2019-004',
    admissionDate: '2019-06-03',
    rollNumber: '08A-04',
    gradeLevel: '8',
    section: 'A',
    class: '8A',
    gpa: 3.6,
    performance: 'Good',
    percentage: 91,
    status: 'Active',
    studentInfo: {
      hobbies: 'Bharatanatyam, Reading',
      specialNeedsSupport: false,
      medicalConditionAlert: false,
      medicalInfo: 'No known allergies',
      fatherOccupation: 'Software Engineer',
      motherOccupation: 'Bank Manager',
    },
    // The same two people as Kendriya's Aarav Sharma, character for
    // character — that is what makes them one parent and not four.
    guardians: {
      father: { name: 'Rohan Sharma', phoneCountryCode: '+91', phone: '9845123457' },
      mother: { name: 'Meera Sharma', phoneCountryCode: '+91', phone: '9845123458' },
    },
    syncedAt: '2026-04-01T09:00:00.000Z',
    syncVersion: 1,
  },
]

export const studentFixtures: Student[] = generateRoster({
  code: 'vidya-mandir',
  city: MYSURU,
  sections: DEFAULT_CLASS_SECTIONS.map(({ grade, section }) => ({ grade, section })),
  // Smaller classes than Kendriya's, because it is a smaller school and the
  // two should not report the same numbers.
  classSize: [14, 22],
  codePrefix: 'VM-',
  codeBase: 3010,
  admissionPrefix: 'VM-ADM',
  idPrefix: 'vm-',
  userIdBase: 5100,
  phoneBase: 9880200000,
  academicYearStart: 2026,
  anchors,
})
