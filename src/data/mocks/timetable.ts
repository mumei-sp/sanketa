/**
 * Timetable Mock Data
 *
 * Contains subjects registry, class sections, weekly timetable templates,
 * and exception records. This file is the reference implementation for
 * the data model — backend should mirror these structures.
 *
 * Storage strategy: Template + Exception pattern
 * - Templates: one per class (weekly, ~30 slots each)
 * - Exceptions: only deviations from the norm (substitutions, cancellations)
 */

import { accent, primary, status, border } from '@/theme/colors'
import type {
  Subject,
  ClassSection,
  ClassTimetable,
  TimetableSlot,
  TimetableException,
} from '@/features/timetable/types'

// ============================================================================
// Subjects Registry — colors from theme tokens, never hardcoded hex
// ============================================================================

export const subjects: Subject[] = [
  { id: 'math',    name: 'Mathematics',        shortName: 'Math',    color: accent.base },
  { id: 'eng',     name: 'English',            shortName: 'Eng',     color: primary.base },
  { id: 'sci',     name: 'Science',            shortName: 'Sci',     color: accent.soft },
  { id: 'sst',     name: 'Social Studies',     shortName: 'SSt',     color: primary.soft },
  { id: 'hindi',   name: 'Hindi',              shortName: 'Hin',     color: status.success.soft },
  { id: 'cs',      name: 'Computer Science',   shortName: 'CS',      color: accent.muted },
  { id: 'pe',      name: 'Physical Education', shortName: 'PE',      color: status.warning.soft },
  { id: 'art',     name: 'Art',                shortName: 'Art',     color: primary.muted },
  { id: 'music',   name: 'Music',              shortName: 'Mus',     color: accent.subtle },
  { id: 'library', name: 'Library',            shortName: 'Lib',     color: border.default },
]

/** Look up subject by ID */
export function getSubjectById(id: string): Subject | undefined {
  return subjects.find(s => s.id === id)
}

// ============================================================================
// Class Sections
// ============================================================================

export const classSections: ClassSection[] = [
  // Grade 1
  { id: 'cls-1a', grade: '1', section: 'A', label: '1A' },
  { id: 'cls-1b', grade: '1', section: 'B', label: '1B' },
  // Grade 2
  { id: 'cls-2a', grade: '2', section: 'A', label: '2A' },
  { id: 'cls-2b', grade: '2', section: 'B', label: '2B' },
  // Grade 3
  { id: 'cls-3a', grade: '3', section: 'A', label: '3A' },
  // Grade 4
  { id: 'cls-4a', grade: '4', section: 'A', label: '4A' },
  // Grade 5
  { id: 'cls-5a', grade: '5', section: 'A', label: '5A' },
  { id: 'cls-5b', grade: '5', section: 'B', label: '5B' },
  // Grade 6
  { id: 'cls-6a', grade: '6', section: 'A', label: '6A' },
  // Grade 7
  { id: 'cls-7a', grade: '7', section: 'A', label: '7A' },
  // Grade 8
  { id: 'cls-8a', grade: '8', section: 'A', label: '8A' },
  { id: 'cls-8b', grade: '8', section: 'B', label: '8B' },
  // Grade 9
  { id: 'cls-9a', grade: '9', section: 'A', label: '9A' },
  { id: 'cls-9b', grade: '9', section: 'B', label: '9B' },
  // Grade 10
  { id: 'cls-10a', grade: '10', section: 'A', label: '10A' },
  { id: 'cls-10b', grade: '10', section: 'B', label: '10B' },
]

// ============================================================================
// Helper: build slot
// ============================================================================

function slot(day: number, periodId: string, subjectId: string, subjectName: string, teacherId: string, teacherName: string, room?: string): TimetableSlot {
  return { dayOfWeek: day, periodId, subjectId, subjectName, teacherId, teacherName, room }
}

// ============================================================================
// Class 9A Timetable
// ============================================================================

const class9ASlots: TimetableSlot[] = [
  // Monday
  slot(0, 'p1', 'math',  'Mathematics',       '1', 'Ms. Lee',    'Room 201'),
  slot(0, 'p2', 'eng',   'English',            '2', 'Mr. Roy',    'Room 201'),
  slot(0, 'p3', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 3'),
  slot(0, 'p4', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 201'),
  slot(0, 'p5', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 201'),
  slot(0, 'p6', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  // Tuesday
  slot(1, 'p1', 'eng',   'English',            '2', 'Mr. Roy',    'Room 201'),
  slot(1, 'p2', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 201'),
  slot(1, 'p3', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 201'),
  slot(1, 'p4', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 3'),
  slot(1, 'p5', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  slot(1, 'p6', 'art',   'Art',                '2', 'Mr. Roy',    'Art Room'),
  // Wednesday
  slot(2, 'p1', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 3'),
  slot(2, 'p2', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 201'),
  slot(2, 'p3', 'eng',   'English',            '2', 'Mr. Roy',    'Room 201'),
  slot(2, 'p4', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  slot(2, 'p5', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 201'),
  slot(2, 'p6', 'music', 'Music',              '5', 'Mr. Shah',   'Music Room'),
  // Thursday
  slot(3, 'p1', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 201'),
  slot(3, 'p2', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 3'),
  slot(3, 'p3', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 201'),
  slot(3, 'p4', 'eng',   'English',            '2', 'Mr. Roy',    'Room 201'),
  slot(3, 'p5', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 201'),
  slot(3, 'p6', 'library','Library',            '2', 'Mr. Roy',    'Library'),
  // Friday
  slot(4, 'p1', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 201'),
  slot(4, 'p2', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 201'),
  slot(4, 'p3', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  slot(4, 'p4', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 3'),
  slot(4, 'p5', 'eng',   'English',            '2', 'Mr. Roy',    'Room 201'),
  slot(4, 'p6', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
]

// ============================================================================
// Class 8B Timetable
// ============================================================================

const class8BSlots: TimetableSlot[] = [
  // Monday
  slot(0, 'p1', 'eng',   'English',            '2', 'Mr. Roy',    'Room 105'),
  slot(0, 'p2', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 2'),
  slot(0, 'p3', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 105'),
  slot(0, 'p4', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 105'),
  slot(0, 'p5', 'art',   'Art',                '2', 'Mr. Roy',    'Art Room'),
  slot(0, 'p6', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 105'),
  // Tuesday
  slot(1, 'p1', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 105'),
  slot(1, 'p2', 'eng',   'English',            '2', 'Mr. Roy',    'Room 105'),
  slot(1, 'p3', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  slot(1, 'p4', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 105'),
  slot(1, 'p5', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 2'),
  slot(1, 'p6', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 105'),
  // Wednesday
  slot(2, 'p1', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 105'),
  slot(2, 'p2', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 105'),
  slot(2, 'p3', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 2'),
  slot(2, 'p4', 'eng',   'English',            '2', 'Mr. Roy',    'Room 105'),
  slot(2, 'p5', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  slot(2, 'p6', 'music', 'Music',              '5', 'Mr. Shah',   'Music Room'),
  // Thursday
  slot(3, 'p1', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 2'),
  slot(3, 'p2', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 105'),
  slot(3, 'p3', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 105'),
  slot(3, 'p4', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  slot(3, 'p5', 'eng',   'English',            '2', 'Mr. Roy',    'Room 105'),
  slot(3, 'p6', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  // Friday
  slot(4, 'p1', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 105'),
  slot(4, 'p2', 'eng',   'English',            '2', 'Mr. Roy',    'Room 105'),
  slot(4, 'p3', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 105'),
  slot(4, 'p4', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 105'),
  slot(4, 'p5', 'library','Library',            '2', 'Mr. Roy',    'Library'),
  slot(4, 'p6', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 2'),
]

// ============================================================================
// Class 7A Timetable
// ============================================================================

const class7ASlots: TimetableSlot[] = [
  // Monday
  slot(0, 'p1', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 1'),
  slot(0, 'p2', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 301'),
  slot(0, 'p3', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 301'),
  slot(0, 'p4', 'eng',   'English',            '2', 'Mr. Roy',    'Room 301'),
  slot(0, 'p5', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  slot(0, 'p6', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 301'),
  // Tuesday
  slot(1, 'p1', 'eng',   'English',            '2', 'Mr. Roy',    'Room 301'),
  slot(1, 'p2', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 301'),
  slot(1, 'p3', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 301'),
  slot(1, 'p4', 'art',   'Art',                '2', 'Mr. Roy',    'Art Room'),
  slot(1, 'p5', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 301'),
  slot(1, 'p6', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 1'),
  // Wednesday
  slot(2, 'p1', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 301'),
  slot(2, 'p2', 'eng',   'English',            '2', 'Mr. Roy',    'Room 301'),
  slot(2, 'p3', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 1'),
  slot(2, 'p4', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  slot(2, 'p5', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 301'),
  slot(2, 'p6', 'library','Library',            '2', 'Mr. Roy',    'Library'),
  // Thursday
  slot(3, 'p1', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 301'),
  slot(3, 'p2', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 1'),
  slot(3, 'p3', 'eng',   'English',            '2', 'Mr. Roy',    'Room 301'),
  slot(3, 'p4', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 301'),
  slot(3, 'p5', 'music', 'Music',              '5', 'Mr. Shah',   'Music Room'),
  slot(3, 'p6', 'cs',    'Computer Science',   '1', 'Ms. Lee',    'Lab 1'),
  // Friday
  slot(4, 'p1', 'math',  'Mathematics',        '1', 'Ms. Lee',    'Room 301'),
  slot(4, 'p2', 'sst',   'Social Studies',     '4', 'Mr. Sharma', 'Room 301'),
  slot(4, 'p3', 'eng',   'English',            '2', 'Mr. Roy',    'Room 301'),
  slot(4, 'p4', 'hindi', 'Hindi',              '5', 'Mr. Shah',   'Room 301'),
  slot(4, 'p5', 'pe',    'Physical Education',  '4', 'Mr. Sharma', 'Ground'),
  slot(4, 'p6', 'sci',   'Science',            '3', 'Ms. Patel',  'Lab 1'),
]

// ============================================================================
// All Timetables
// ============================================================================

export const classTimetables: ClassTimetable[] = [
  {
    id: 'tt-9a-2035',
    classSectionId: 'cls-9a',
    academicYear: '2035-36',
    effectiveFrom: '2035-04-01',
    slots: class9ASlots,
  },
  {
    id: 'tt-8b-2035',
    classSectionId: 'cls-8b',
    academicYear: '2035-36',
    effectiveFrom: '2035-04-01',
    slots: class8BSlots,
  },
  {
    id: 'tt-7a-2035',
    classSectionId: 'cls-7a',
    academicYear: '2035-36',
    effectiveFrom: '2035-04-01',
    slots: class7ASlots,
  },
]

// ============================================================================
// Exceptions (deviations from normal schedule)
// ============================================================================

export const timetableExceptions: TimetableException[] = [
  {
    id: 'exc-1',
    classSectionId: 'cls-9a',
    date: '2035-03-10',
    periodId: 'p1',
    type: 'substitution',
    originalSubject: 'Mathematics',
    originalTeacher: 'Ms. Lee',
    newSubject: 'Mathematics',
    newTeacher: '3',
    newTeacherName: 'Ms. Patel',
    reason: 'Ms. Lee on medical leave',
  },
  {
    id: 'exc-2',
    classSectionId: 'cls-9a',
    date: '2035-03-14',
    periodId: 'p5',
    type: 'cancellation',
    originalSubject: 'Hindi',
    originalTeacher: 'Mr. Shah',
    reason: 'School assembly — Independence Day rehearsal',
  },
  {
    id: 'exc-3',
    classSectionId: 'cls-9a',
    date: '2035-03-18',
    periodId: 'p6',
    type: 'extra-class',
    newSubject: 'Mathematics',
    newTeacher: '1',
    newTeacherName: 'Ms. Lee',
    reason: 'Extra revision class before mid-term exam',
  },
  {
    id: 'exc-4',
    classSectionId: 'cls-8b',
    date: '2035-03-12',
    periodId: 'p3',
    type: 'substitution',
    originalSubject: 'Mathematics',
    originalTeacher: 'Ms. Lee',
    newSubject: 'Science',
    newTeacher: '3',
    newTeacherName: 'Ms. Patel',
    reason: 'Teacher swap for lab availability',
  },
]
