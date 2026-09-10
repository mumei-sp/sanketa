/**
 * Kendriya Vidyalaya's calendar.
 *
 * Fifteen occasions across the current month: exams, staff meetings, the fee
 * deadline, the science fair. Placed with `calDay(N)` so they always land on
 * real dates in the month the app is being viewed.
 *
 * Its own, because a school's calendar is the least shareable thing it has.
 * One list meant the same English Literature exam sat in Room 204 on the same
 * morning at a school in Bangalore and a school in Mysuru.
 */

import type { CalendarEvent } from '@/features/calendar/types'
import { calDay, createEvent, createAllDayEvent } from '../_generate/calendar'

export const calendarFixtures: CalendarEvent[] = [
  // ── Week 1 (Feb 25 – Mar 3) ──────────────────────────────────────────
  createEvent(
    'evt-01', 'Science Project Submission Deadline', 'Academic',
    calDay(1), '10:00 AM', undefined,
    'Room 101', 'Submit all science projects via the online portal.',
    { priority: 'high', link: 'https://portal.school.edu/submissions', attendees: 'Grade 9 & 10 Students' },
  ),
  createEvent(
    'evt-02', 'Monthly Expense Review', 'Finance',
    calDay(1), '03:00 PM', '04:00 PM',
    'Conference Room B', 'Review monthly budget allocations and expenditures.',
    { priority: 'medium', attendees: 'Finance Committee', reminder: '15min' },
  ),

  // ── Week 2 (Mar 4–10) ────────────────────────────────────────────────
  createEvent(
    'evt-03', 'Sports Competition (Preliminary Round)', 'Events',
    calDay(6), '08:30 AM', '12:00 PM',
    'Sports Ground', 'Preliminary round for inter-school sports competition.',
    { description: 'Teams from 8 schools participating. Events include track, field, and team sports.', priority: 'medium', attendees: 'All Students' },
  ),
  createEvent(
    'evt-04', 'Midterm Exam – Mathematics', 'Academic',
    calDay(7), '09:00 AM', '11:00 AM',
    'Exam Hall A', 'No electronic devices allowed. Bring your own stationery.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'evt-05', 'Staff Meeting', 'Administration',
    calDay(7), '02:00 PM', '03:30 PM',
    'Board Room', 'Monthly staff alignment meeting with department heads.',
    { link: 'https://meet.school.edu/staff-monthly', priority: 'medium', attendees: 'Department Heads' },
  ),
  createEvent(
    'evt-06', 'Teacher Development Workshop', 'Administration',
    calDay(9), '01:00 PM', '05:00 PM',
    'Training Center', 'Professional development session for all teaching staff.',
    { description: 'Workshop on modern pedagogical techniques and classroom management.', priority: 'low', attendees: 'All Teaching Staff', reminder: '1hr' },
  ),

  // ── Week 3 (Mar 11–17) ───────────────────────────────────────────────
  createEvent(
    'evt-07', 'English Literature Exam', 'Academic',
    calDay(12), '09:00 AM', '11:00 AM',
    'Room 204', 'Bring your own stationery; no electronic devices allowed.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'evt-08', 'Parent-Teacher Meeting (Grade 7 & 8)', 'Events',
    calDay(12), '02:00 PM', '04:00 PM',
    'School Auditorium', 'Parents are requested to arrive 15 minutes early for registration.',
    { description: 'Discuss student progress, upcoming curriculum changes, and extra-curricular activities.', priority: 'high', attendees: 'Grade 7 & 8 Parents, Class Teachers', link: 'https://portal.school.edu/ptm-schedule' },
  ),
  createEvent(
    'evt-09', 'History Exam', 'Academic',
    calDay(14), '09:00 AM', '11:00 AM',
    'Exam Hall B', 'Covers chapters 5-12 from the prescribed textbook.',
    { priority: 'high' },
  ),
  createEvent(
    'evt-10', 'School Choir Rehearsal', 'Events',
    calDay(15), '10:00 AM', '12:00 PM',
    'Music Room', 'Rehearsal for the upcoming annual day performance.',
    { priority: 'low', attendees: 'Choir Members' },
  ),

  // ── Week 4 (Mar 18–24) ───────────────────────────────────────────────
  createEvent(
    'evt-11', 'Monthly Staff Appraisal', 'Administration',
    calDay(20), '02:00 PM', '04:00 PM',
    'Board Room', 'Monthly performance review with department heads.',
    { priority: 'medium', attendees: 'Department Heads, HR' },
  ),
  createAllDayEvent(
    'evt-12', 'Grade 9 Fee Payment Deadline', 'Finance',
    calDay(23),
    'Accounts Office', 'Last date for fee submission without late penalty.',
    { priority: 'high', link: 'https://portal.school.edu/fee-payment', attendees: 'Grade 9 Parents' },
  ),

  // ── Week 5 (Mar 25–31) ───────────────────────────────────────────────
  createEvent(
    'evt-13', 'Annual Science Fair', 'Events',
    calDay(26), '09:00 AM', '05:00 PM',
    'Main Hall', 'Students showcase science projects from all grades.',
    { description: 'Annual exhibition where students present their science projects. External judges from local universities.', priority: 'medium', attendees: 'All Students, Parents, Faculty' },
  ),
  createEvent(
    'evt-14', 'Quarterly Performance Review Meeting', 'Administration',
    calDay(28), '01:00 PM', '03:00 PM',
    'Conference Room A', 'Q1 academic performance review with department heads.',
    { priority: 'medium', attendees: 'Administration, Department Heads', reminder: '30min' },
  ),
  createEvent(
    'evt-15', 'Final Exam – Chemistry', 'Academic',
    calDay(29), '08:30 AM', '10:30 AM',
    'Exam Hall A', 'Covers all chapters from the semester syllabus.',
    { priority: 'high', reminder: '1day' },
  ),
]
