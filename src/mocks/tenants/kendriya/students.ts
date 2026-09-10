/**
 * Kendriya Vidyalaya's roster.
 *
 * Two hand-written students and the rest generated — see
 * `../_generate/roster.ts` for why generated, and for what "generated" buys
 * that four hundred hand-typed rows would not.
 *
 * ── The two that are written out ───────────────────────────────────────
 * `anchors` are the students other fixtures make claims about. Aarav Sharma's
 * father has a second child at Vidya Mandir, which is the case the whole
 * global-identity split exists for; Nikhil Iyengar's mother teaches 8A and 8B
 * here and his class is 9B, which is the case a single role per person could
 * never express. Both are asserted elsewhere — in the access fixtures, in the
 * other school's roster — so both are pinned rather than left to the dice.
 *
 * Everything else about the school is a consequence of the config below: the
 * classes come from the school's own section list, so no student is enrolled
 * in a class the timetable does not offer and no class the picker offers is
 * empty. That was not true before — nineteen sections were configured and
 * students sat in eight of them.
 */

import type { Student } from '@/features/students/types'
import { DEFAULT_CLASS_SECTIONS } from '@/config/school-config'
import { generateRoster, BANGALORE } from '../_generate'

/**
 * The students other fixtures name.
 *
 * Their ids, codes and roll numbers are load-bearing. Renumber one and the
 * access fixtures point at nobody, which fails as an empty family view rather
 * than as an error.
 */
const anchors: Student[] = [
  {
    id: '1',
    userId: 1001,
    profileType: 0,
    firstName: 'Aarav',
    lastName: 'Sharma',
    fullName: 'Aarav Sharma',
    displayName: 'Aarav Sharma',
    preferredName: 'Aarav',
    name: 'Aarav Sharma',
    dateOfBirth: '2014-03-15',
    gender: 0,
    primaryPhone: '9845123457',
    phoneCountryCode: '+91',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav%20Sharma',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav%20Sharma',
    address: '42, 7th A Cross, HSR Layout, Bengaluru, Karnataka 560102, India',
    studentId: 'S-2101',
    admissionNumber: 'ADM-2020-007',
    admissionDate: '2020-06-05',
    rollNumber: '07A-15',
    gradeLevel: '7',
    section: 'A',
    class: '7A',
    gpa: 3.8,
    performance: 'Good',
    percentage: 95,
    status: 'Active',
    studentInfo: {
      hobbies: 'Cricket, Reading, Coding',
      specialNeedsSupport: false,
      medicalConditionAlert: false,
      medicalInfo: 'No known allergies',
      fatherOccupation: 'Software Engineer',
      motherOccupation: 'Bank Manager',
    },
    // Rohan Sharma also has a daughter at Vidya Mandir, on this same number.
    // One father, one account, two schools — see `../vidya-mandir/students.ts`.
    guardians: {
      father: { name: 'Rohan Sharma', phoneCountryCode: '+91', phone: '9845123457' },
      mother: { name: 'Meera Sharma', phoneCountryCode: '+91', phone: '9845123458' },
    },
    syncedAt: '2026-04-01T09:00:00.000Z',
    syncVersion: 1,
  },
  {
    id: '2',
    userId: 1002,
    profileType: 0,
    firstName: 'Nikhil',
    lastName: 'Iyengar',
    fullName: 'Nikhil Iyengar',
    displayName: 'Nikhil Iyengar',
    preferredName: 'Nikhil',
    name: 'Nikhil Iyengar',
    dateOfBirth: '2012-11-02',
    gender: 0,
    primaryPhone: '9880114477',
    phoneCountryCode: '+91',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil%20Iyengar',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil%20Iyengar',
    address: '9, 4th Main Road, Malleshwaram, Bengaluru, Karnataka 560003, India',
    studentId: 'S-2102',
    admissionNumber: 'ADM-2018-014',
    admissionDate: '2018-06-08',
    rollNumber: '09B-08',
    gradeLevel: '9',
    section: 'B',
    class: '9B',
    gpa: 3.4,
    performance: 'Good',
    percentage: 86,
    status: 'Active',
    studentInfo: {
      hobbies: 'Chess, Keyboard',
      specialNeedsSupport: false,
      medicalConditionAlert: true,
      medicalInfo: 'Mild asthma — inhaler with class teacher',
      fatherOccupation: 'Civil Engineer',
      motherOccupation: 'School Teacher',
    },
    // His mother is on the staff — she teaches 8A and 8B, not 9B. The access
    // fixtures join to her on this number; changing it unlinks her from her
    // own son without anything failing.
    guardians: {
      father: { name: 'Srinivas Iyengar', phoneCountryCode: '+91', phone: '9880114478' },
      mother: { name: 'Meera Iyengar', phoneCountryCode: '+91', phone: '9880114477' },
    },
    syncedAt: '2026-04-01T09:00:00.000Z',
    syncVersion: 1,
  },
]

/**
 * The seed rows for the student directory.
 *
 * Read on a browser that has never run the app, and again whenever this list
 * changes — `store.ts` fingerprints it, so an edit here reseeds rather than
 * being shadowed by the copy on disk. Everything else goes through the store.
 */
export const studentFixtures: Student[] = generateRoster({
  code: 'kendriya',
  city: BANGALORE,
  // The school's own sections, so the roster and the timetable are about the
  // same nineteen classes.
  sections: DEFAULT_CLASS_SECTIONS.map(({ grade, section }) => ({ grade, section })),
  classSize: [20, 30],
  codePrefix: 'S-',
  // Past the anchors' S-2101 and S-2102, so nothing is issued twice.
  codeBase: 2110,
  admissionPrefix: 'ADM',
  idPrefix: '',
  userIdBase: 1100,
  phoneBase: 9845100000,
  academicYearStart: 2026,
  anchors,
})
