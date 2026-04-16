import type { Teacher } from '@/features/teachers/types'

/**
 * Mock teacher data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */
export const teachersData: Teacher[] = [
  {
    id: '1',
    userId: 2001,
    profileType: 1, // TEACHER
    firstName: 'Argen',
    lastName: 'Maulie',
    fullName: 'Argen Maulie',
    displayName: 'Argen Maulie',
    dateOfBirth: '1985-05-20',
    gender: 0, // MALE
    primaryPhone: '81234567890',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Argen',
    teacherId: 'T-1001',
    subject: 'Mathematics',
    email: 'argen.maulie@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Argen',
  },
  {
    id: '2',
    userId: 2002,
    profileType: 1, // TEACHER
    firstName: 'Bella',
    lastName: 'Cruz',
    fullName: 'Bella Cruz',
    displayName: 'Bella Cruz',
    dateOfBirth: '1988-08-15',
    gender: 1, // FEMALE
    primaryPhone: '81322345567',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    teacherId: 'T-1002',
    subject: 'Social Studies - Civics',
    email: 'bella.cruz@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  },
  {
    id: '3',
    userId: 2003,
    profileType: 1, // TEACHER
    firstName: 'Cliff',
    lastName: 'Villiam',
    fullName: 'Cliff Villiam',
    displayName: 'Cliff Villiam',
    dateOfBirth: '1987-03-10',
    gender: 0, // MALE
    primaryPhone: '81155672345',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cliff',
    teacherId: 'T-1003',
    subject: 'English Language',
    email: 'cliff.villiam@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cliff',
  },
  {
    id: '4',
    userId: 2004,
    profileType: 1, // TEACHER
    firstName: 'Dariah',
    lastName: 'Ahmed',
    fullName: 'Dariah Ahmed',
    displayName: 'Dariah Ahmed',
    dateOfBirth: '1989-11-25',
    gender: 1, // FEMALE
    primaryPhone: '81598765432',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dariah',
    teacherId: 'T-1004',
    subject: 'Social Studies - History',
    email: 'dariah.ahmed@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dariah',
  },
  {
    id: '5',
    userId: 2005,
    profileType: 1, // TEACHER
    firstName: 'Esteban',
    lastName: 'Parez',
    fullName: 'Esteban Parez',
    displayName: 'Esteban Parez',
    dateOfBirth: '1986-07-18',
    gender: 0, // MALE
    primaryPhone: '81965432109',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Esteban',
    teacherId: 'T-1005',
    subject: 'Arts - Visual Arts',
    email: 'esteban.parez@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Esteban',
  },
  {
    id: '6',
    userId: 2006,
    profileType: 1, // TEACHER
    firstName: 'Francesca',
    lastName: 'Gill',
    fullName: 'Francesca Gill',
    displayName: 'Francesca Gill',
    dateOfBirth: '1990-02-14',
    gender: 1, // FEMALE
    primaryPhone: '81722334455',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Francesca',
    teacherId: 'T-1006',
    subject: 'Physical Education',
    email: 'francesca.gill@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Francesca',
  },
  {
    id: '7',
    userId: 2007,
    profileType: 1, // TEACHER
    firstName: 'George',
    lastName: 'Abraham',
    fullName: 'George Abraham',
    displayName: 'George Abraham',
    dateOfBirth: '1984-09-30',
    gender: 0, // MALE
    primaryPhone: '81677889900',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George',
    teacherId: 'T-1007',
    subject: 'Mathematics - Algebra',
    email: 'george.abraham@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George',
  },
  {
    id: '8',
    userId: 2008,
    profileType: 1, // TEACHER
    firstName: 'Hellen',
    lastName: 'Martinez',
    fullName: 'Hellen Martinez',
    displayName: 'Hellen Martinez',
    dateOfBirth: '1987-12-05',
    gender: 1, // FEMALE
    primaryPhone: '81466778899',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hellen',
    teacherId: 'T-1008',
    subject: 'Science - Biology',
    email: 'hellen.martinez@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hellen',
  },
  // Additional teachers to reach 82 total (as shown in pagination)
  {
    id: '9',
    userId: 2009,
    profileType: 1,
    firstName: 'James',
    lastName: 'Wilson',
    fullName: 'James Wilson',
    displayName: 'James Wilson',
    dateOfBirth: '1985-04-12',
    gender: 0,
    primaryPhone: '81234567891',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    teacherId: 'T-1009',
    subject: 'Science - Chemistry',
    email: 'james.wilson@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  },
  {
    id: '10',
    userId: 2010,
    profileType: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    fullName: 'Sarah Johnson',
    displayName: 'Sarah Johnson',
    dateOfBirth: '1986-06-22',
    gender: 1,
    primaryPhone: '81234567892',
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    teacherId: 'T-1010',
    subject: 'English Literature',
    email: 'sarah.johnson@studixschool.org',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
]

