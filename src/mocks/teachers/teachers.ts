import type { Teacher } from '@/features/teachers/types'
import { SCHOOL_DOMAIN, PHONE_COUNTRY_CODE } from '@/mocks/_shared/constants'
import { DEFAULT_CLASS_SECTIONS } from '@/config/school-config'
import { additionalFaculty } from './additional-faculty'

/**
 * Every teacher owns two class sections, and between them the eighteen of them
 * cover all nineteen — which they did not: half the pairs were copies of
 * another teacher's, so 7B, 7C and 8C had nobody on the faculty list, while
 * `classTeacherOf` quietly fell back to a hash pick for them.
 *
 * Deterministic rather than random so the dataset replays identically, and
 * paired so the difference between "my class" and "a class I can only read" is
 * visible on any screen.
 */
/**
 * Mock teacher data for development and testing.
 *
 * Regionally appropriate for Sanketa (Bangalore, Karnataka) — mix of Indian
 * surnames spanning the four major linguistic regions, plus a couple of
 * non-Indian colleagues for realism (most Bangalore schools have some).
 * All emails resolve to the canonical @sanketa.edu domain, phones are valid
 * 10-digit Indian mobile numbers (TRAI-compliant starting digits).
 *
 * Subjects align with CBSE / ICSE secondary-school curricula.
 */
const namedFaculty: Teacher[] = [
  {
    id: '1',
    userId: 2001,
    profileType: 1, // TEACHER
    firstName: 'Aditi',
    lastName: 'Sharma',
    fullName: 'Aditi Sharma',
    displayName: 'Aditi Sharma',
    dateOfBirth: '1985-05-20',
    gender: 1, // FEMALE
    primaryPhone: '9845612378',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi',
    teacherId: 'T-1001',
    assignedClasses: ['1A', '1B'],
    subject: 'Mathematics',
    employmentType: 'Full-Time',
    email: `aditi.sharma@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi',
  },
  {
    id: '2',
    userId: 2002,
    profileType: 1,
    firstName: 'Priya',
    lastName: 'Nair',
    fullName: 'Priya Nair',
    displayName: 'Priya Nair',
    dateOfBirth: '1988-08-15',
    gender: 1,
    primaryPhone: '9741220345',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    teacherId: 'T-1002',
    assignedClasses: ['2A', '2B'],
    subject: 'Social Studies - Civics',
    employmentType: 'Full-Time',
    email: `priya.nair@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  },
  {
    id: '3',
    userId: 2003,
    profileType: 1,
    firstName: 'Rahul',
    lastName: 'Iyer',
    fullName: 'Rahul Iyer',
    displayName: 'Rahul Iyer',
    dateOfBirth: '1987-03-10',
    gender: 0,
    primaryPhone: '9880114567',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    teacherId: 'T-1003',
    assignedClasses: ['3A', '4A'],
    subject: 'English Language',
    employmentType: 'Full-Time',
    email: `rahul.iyer@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  },
  {
    id: '4',
    userId: 2004,
    profileType: 1,
    firstName: 'Ayesha',
    lastName: 'Khan',
    fullName: 'Ayesha Khan',
    displayName: 'Ayesha Khan',
    dateOfBirth: '1989-11-25',
    gender: 1,
    primaryPhone: '9611998712',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayesha',
    teacherId: 'T-1004',
    assignedClasses: ['5A', '5B'],
    subject: 'Social Studies - History',
    employmentType: 'Full-Time',
    email: `ayesha.khan@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayesha',
  },
  {
    id: '5',
    userId: 2005,
    profileType: 1,
    firstName: 'Vikram',
    lastName: 'Reddy',
    fullName: 'Vikram Reddy',
    displayName: 'Vikram Reddy',
    dateOfBirth: '1986-07-18',
    gender: 0,
    primaryPhone: '8904455321',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    teacherId: 'T-1005',
    assignedClasses: ['6A', '7A'],
    subject: 'Arts - Visual Arts',
    employmentType: 'Full-Time',
    email: `vikram.reddy@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
  },
  {
    id: '6',
    userId: 2006,
    profileType: 1,
    firstName: 'Meera',
    lastName: 'Iyengar',
    fullName: 'Meera Iyengar',
    displayName: 'Meera Iyengar',
    dateOfBirth: '1990-02-14',
    gender: 1,
    primaryPhone: '9845332110',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
    teacherId: 'T-1006',
    assignedClasses: ['8A', '8B'],
    subject: 'Physical Education',
    employmentType: 'Full-Time',
    email: `meera.iyengar@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
  },
  {
    id: '7',
    userId: 2007,
    profileType: 1,
    firstName: 'Karthik',
    lastName: 'Menon',
    fullName: 'Karthik Menon',
    displayName: 'Karthik Menon',
    dateOfBirth: '1984-09-30',
    gender: 0,
    primaryPhone: '9738220119',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik',
    teacherId: 'T-1007',
    assignedClasses: ['9A', '9B'],
    subject: 'Mathematics - Algebra',
    employmentType: 'Full-Time',
    email: `karthik.menon@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik',
  },
  {
    id: '8',
    userId: 2008,
    profileType: 1,
    firstName: 'Anjali',
    lastName: 'Krishnan',
    fullName: 'Anjali Krishnan',
    displayName: 'Anjali Krishnan',
    dateOfBirth: '1987-12-05',
    gender: 1,
    primaryPhone: '9900887766',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
    teacherId: 'T-1008',
    assignedClasses: ['10A', '10B'],
    subject: 'Science - Biology',
    employmentType: 'Full-Time',
    email: `anjali.krishnan@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
  },
  {
    id: '9',
    userId: 2009,
    profileType: 1,
    firstName: 'Suresh',
    lastName: 'Kumar',
    fullName: 'Suresh Kumar',
    displayName: 'Suresh Kumar',
    dateOfBirth: '1985-04-12',
    gender: 0,
    primaryPhone: '9845112234',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    teacherId: 'T-1009',
    assignedClasses: ['7B', '7C'],
    subject: 'Science - Chemistry',
    employmentType: 'Full-Time',
    email: `suresh.kumar@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
  },
  {
    id: '10',
    userId: 2010,
    profileType: 1,
    firstName: 'Divya',
    lastName: 'Patel',
    fullName: 'Divya Patel',
    displayName: 'Divya Patel',
    dateOfBirth: '1986-06-22',
    gender: 1,
    primaryPhone: '9632114567',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya',
    teacherId: 'T-1010',
    assignedClasses: ['8C', '6A'],
    subject: 'English Literature',
    employmentType: 'Full-Time',
    email: `divya.patel@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya',
  },
  {
    id: '11',
    userId: 2011,
    profileType: 1,
    firstName: 'Arvind',
    lastName: 'Rao',
    fullName: 'Arvind Rao',
    displayName: 'Arvind Rao',
    dateOfBirth: '1982-10-09',
    gender: 0,
    primaryPhone: '9845667788',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arvind',
    teacherId: 'T-1011',
    assignedClasses: ['1A', '3A'],
    subject: 'Science - Physics',
    employmentType: 'Full-Time',
    email: `arvind.rao@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arvind',
  },
  {
    id: '12',
    userId: 2012,
    profileType: 1,
    firstName: 'Ritika',
    lastName: 'Banerjee',
    fullName: 'Ritika Banerjee',
    displayName: 'Ritika Banerjee',
    dateOfBirth: '1991-01-27',
    gender: 1,
    primaryPhone: '9820221345',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ritika',
    teacherId: 'T-1012',
    assignedClasses: ['2A', '4A'],
    subject: 'Hindi',
    employmentType: 'Full-Time',
    email: `ritika.banerjee@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ritika',
  },
  {
    id: '13',
    userId: 2013,
    profileType: 1,
    firstName: 'Imran',
    lastName: 'Ali',
    fullName: 'Imran Ali',
    displayName: 'Imran Ali',
    dateOfBirth: '1983-08-03',
    gender: 0,
    primaryPhone: '9900123456',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Imran',
    teacherId: 'T-1013',
    assignedClasses: ['5A', '7B'],
    subject: 'Computer Science',
    employmentType: 'Full-Time',
    email: `imran.ali@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Imran',
  },
  {
    id: '14',
    userId: 2014,
    profileType: 1,
    firstName: 'Lakshmi',
    lastName: 'Subramanian',
    fullName: 'Lakshmi Subramanian',
    displayName: 'Lakshmi Subramanian',
    dateOfBirth: '1986-11-19',
    gender: 1,
    primaryPhone: '9900441122',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
    teacherId: 'T-1014',
    assignedClasses: ['8A', '9A'],
    subject: 'Kannada',
    employmentType: 'Full-Time',
    email: `lakshmi.subramanian@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
  },
  {
    id: '15',
    userId: 2015,
    profileType: 1,
    firstName: 'Deepak',
    lastName: 'Chatterjee',
    fullName: 'Deepak Chatterjee',
    displayName: 'Deepak Chatterjee',
    dateOfBirth: '1988-04-06',
    gender: 0,
    primaryPhone: '8884556677',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak',
    teacherId: 'T-1015',
    assignedClasses: ['10A', '7C'],
    subject: 'Social Studies - Geography',
    employmentType: 'Part-Time',
    email: `deepak.chatterjee@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak',
  },
  {
    id: '16',
    userId: 2016,
    profileType: 1,
    firstName: 'Sneha',
    lastName: 'Desai',
    fullName: 'Sneha Desai',
    displayName: 'Sneha Desai',
    dateOfBirth: '1989-07-14',
    gender: 1,
    primaryPhone: '9611334455',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    teacherId: 'T-1016',
    assignedClasses: ['1B', '2B'],
    subject: 'Arts - Music',
    employmentType: 'Part-Time',
    email: `sneha.desai@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
  },
  {
    id: '17',
    userId: 2017,
    profileType: 1,
    firstName: 'Michael',
    lastName: 'D\u2019Souza',
    fullName: 'Michael D’Souza',
    displayName: 'Michael D’Souza',
    dateOfBirth: '1984-02-28',
    gender: 0,
    primaryPhone: '9845998877',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    teacherId: 'T-1017',
    assignedClasses: ['5B', '8C'],
    subject: 'Mathematics - Geometry',
    employmentType: 'Substitute',
    email: `michael.dsouza@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  {
    id: '18',
    userId: 2018,
    profileType: 1,
    firstName: 'Fatima',
    lastName: 'Siddiqui',
    fullName: 'Fatima Siddiqui',
    displayName: 'Fatima Siddiqui',
    dateOfBirth: '1987-09-21',
    gender: 1,
    primaryPhone: '9900334455',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    teacherId: 'T-1018',
    assignedClasses: ['9B', '10B'],
    subject: 'Urdu',
    employmentType: 'Substitute',
    email: `fatima.siddiqui@${SCHOOL_DOMAIN}`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
  },
]

/**
 * Deal the sections round the whole faculty.
 *
 * `assignedClasses` is authorisation — the classes whose registers and marks a
 * teacher may amend — so it is stated rather than derived from the timetable,
 * for the reason set out on the field itself. What it must not be is lopsided:
 * the generated half arrives with none, and leaving them empty means a third
 * of the staff can read everything and write nothing.
 *
 * Two each, dealt round the section list, so every section is held and no
 * section is held by half the school. Rows that already state their own are
 * left alone: the hand-written eighteen say which classes they hold, and the
 * access seed relies on Meera Iyengar holding 8A and 8B.
 */
function dealSections(faculty: Teacher[]): Teacher[] {
  const sections = DEFAULT_CLASS_SECTIONS.map(section => section.label)
  let cursor = 0
  faculty.forEach(teacher => {
    const held = teacher.assignedClasses?.length ?? 0
    if (held > 0) {
      cursor += held
      return
    }
    teacher.assignedClasses = [
      sections[cursor % sections.length],
      sections[(cursor + 1) % sections.length],
    ]
    cursor += 2
  })
  return faculty
}

/**
 * The faculty, both halves of it.
 *
 * The eighteen above are hand-written and stay that way — other fixtures name
 * them, and T-1006 is a profile in the access seed. The rest are generated
 * from the load the timetable implies; see `additional-faculty.ts` for why
 * eighteen could not staff nineteen sections.
 */
export const teachersData: Teacher[] = dealSections([...namedFaculty, ...additionalFaculty])
