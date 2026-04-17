import { categoryConfig } from '@/features/calendar/utils/category-config'
import { baseColors, background } from '@/theme/colors'
import type { CalendarEvent, EventCategory, EventPriority, EventReminder } from '@/features/calendar/types'

/**
 * Convert 12-hour time string to 24-hour ISO format
 */
function to24h(time12h: string): string {
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (modifier === 'PM' && hours !== 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

interface EventExtras {
  description?: string
  link?: string
  attendees?: string
  priority?: EventPriority
  reminder?: EventReminder
}

/**
 * Factory to create a FullCalendar-compatible event from simple inputs.
 * When swapping to a backend, replace this with API response mapping.
 */
function createEvent(
  id: string,
  title: string,
  category: EventCategory,
  date: string,
  startTime: string,
  endTime?: string,
  location?: string,
  notes?: string,
  extras?: EventExtras,
): CalendarEvent {
  const config = categoryConfig[category]
  return {
    id,
    title,
    start: `${date}T${to24h(startTime)}`,
    end: endTime ? `${date}T${to24h(endTime)}` : `${date}T${to24h(startTime)}`,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    textColor: baseColors.heading,
    extendedProps: {
      category,
      location,
      notes,
      startTimeDisplay: startTime,
      endTimeDisplay: endTime || '',
      description: extras?.description,
      link: extras?.link,
      attendees: extras?.attendees,
      priority: extras?.priority,
      reminder: extras?.reminder,
    },
  }
}

/**
 * Factory for all-day events (e.g. deadlines).
 * Uses the category's borderColor as the block background for a bold look.
 */
function createAllDayEvent(
  id: string,
  title: string,
  category: EventCategory,
  date: string,
  location?: string,
  notes?: string,
  extras?: EventExtras,
): CalendarEvent {
  return {
    id,
    title,
    start: date,
    end: date,
    allDay: true,
    backgroundColor: baseColors.heading,
    borderColor: baseColors.heading,
    textColor: background.card,
    extendedProps: {
      category,
      location,
      notes,
      startTimeDisplay: 'All Day',
      endTimeDisplay: '',
      isAllDay: true,
      description: extras?.description,
      link: extras?.link,
      attendees: extras?.attendees,
      priority: extras?.priority,
      reminder: extras?.reminder,
    },
  }
}

/**
 * Mock calendar events — 15 total
 * Breakdown: Academic (5), Events (4), Finance (2), Administration (4)
 *
 * March 2035: 1st = Thursday
 * Week rows: [Thu1-Sat3] [Sun4-Sat10] [Sun11-Sat17] [Sun18-Sat24] [Sun25-Sat31]
 */
export const mockCalendarEvents: CalendarEvent[] = [
  // ── Week 1 (Feb 25 – Mar 3) ──────────────────────────────────────────
  createEvent(
    'evt-01', 'Science Project Submission Deadline', 'Academic',
    '2035-03-01', '10:00 AM', undefined,
    'Room 101', 'Submit all science projects via the online portal.',
    { priority: 'high', link: 'https://portal.school.edu/submissions', attendees: 'Grade 9 & 10 Students' },
  ),
  createEvent(
    'evt-02', 'Monthly Expense Review', 'Finance',
    '2035-03-01', '03:00 PM', '04:00 PM',
    'Conference Room B', 'Review monthly budget allocations and expenditures.',
    { priority: 'medium', attendees: 'Finance Committee', reminder: '15min' },
  ),

  // ── Week 2 (Mar 4–10) ────────────────────────────────────────────────
  createEvent(
    'evt-03', 'Sports Competition (Preliminary Round)', 'Events',
    '2035-03-06', '08:30 AM', '12:00 PM',
    'Sports Ground', 'Preliminary round for inter-school sports competition.',
    { description: 'Teams from 8 schools participating. Events include track, field, and team sports.', priority: 'medium', attendees: 'All Students' },
  ),
  createEvent(
    'evt-04', 'Midterm Exam – Mathematics', 'Academic',
    '2035-03-07', '09:00 AM', '11:00 AM',
    'Exam Hall A', 'No electronic devices allowed. Bring your own stationery.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'evt-05', 'Staff Meeting', 'Administration',
    '2035-03-07', '02:00 PM', '03:30 PM',
    'Board Room', 'Monthly staff alignment meeting with department heads.',
    { link: 'https://meet.school.edu/staff-monthly', priority: 'medium', attendees: 'Department Heads' },
  ),
  createEvent(
    'evt-06', 'Teacher Development Workshop', 'Administration',
    '2035-03-09', '01:00 PM', '05:00 PM',
    'Training Center', 'Professional development session for all teaching staff.',
    { description: 'Workshop on modern pedagogical techniques and classroom management.', priority: 'low', attendees: 'All Teaching Staff', reminder: '1hr' },
  ),

  // ── Week 3 (Mar 11–17) ───────────────────────────────────────────────
  createEvent(
    'evt-07', 'English Literature Exam', 'Academic',
    '2035-03-12', '09:00 AM', '11:00 AM',
    'Room 204', 'Bring your own stationery; no electronic devices allowed.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'evt-08', 'Parent-Teacher Meeting (Grade 7 & 8)', 'Events',
    '2035-03-12', '02:00 PM', '04:00 PM',
    'School Auditorium', 'Parents are requested to arrive 15 minutes early for registration.',
    { description: 'Discuss student progress, upcoming curriculum changes, and extra-curricular activities.', priority: 'high', attendees: 'Grade 7 & 8 Parents, Class Teachers', link: 'https://portal.school.edu/ptm-schedule' },
  ),
  createEvent(
    'evt-09', 'History Exam', 'Academic',
    '2035-03-14', '09:00 AM', '11:00 AM',
    'Exam Hall B', 'Covers chapters 5-12 from the prescribed textbook.',
    { priority: 'high' },
  ),
  createEvent(
    'evt-10', 'School Choir Rehearsal', 'Events',
    '2035-03-15', '10:00 AM', '12:00 PM',
    'Music Room', 'Rehearsal for the upcoming annual day performance.',
    { priority: 'low', attendees: 'Choir Members' },
  ),

  // ── Week 4 (Mar 18–24) ───────────────────────────────────────────────
  createEvent(
    'evt-11', 'Monthly Staff Appraisal', 'Administration',
    '2035-03-20', '02:00 PM', '04:00 PM',
    'Board Room', 'Monthly performance review with department heads.',
    { priority: 'medium', attendees: 'Department Heads, HR' },
  ),
  createAllDayEvent(
    'evt-12', 'Grade 9 Fee Payment Deadline', 'Finance',
    '2035-03-23',
    'Accounts Office', 'Last date for fee submission without late penalty.',
    { priority: 'high', link: 'https://portal.school.edu/fee-payment', attendees: 'Grade 9 Parents' },
  ),

  // ── Week 5 (Mar 25–31) ───────────────────────────────────────────────
  createEvent(
    'evt-13', 'Annual Science Fair', 'Events',
    '2035-03-26', '09:00 AM', '05:00 PM',
    'Main Hall', 'Students showcase science projects from all grades.',
    { description: 'Annual exhibition where students present their science projects. External judges from local universities.', priority: 'medium', attendees: 'All Students, Parents, Faculty' },
  ),
  createEvent(
    'evt-14', 'Quarterly Performance Review Meeting', 'Administration',
    '2035-03-28', '01:00 PM', '03:00 PM',
    'Conference Room A', 'Q1 academic performance review with department heads.',
    { priority: 'medium', attendees: 'Administration, Department Heads', reminder: '30min' },
  ),
  createEvent(
    'evt-15', 'Final Exam – Chemistry', 'Academic',
    '2035-03-29', '08:30 AM', '10:30 AM',
    'Exam Hall A', 'Covers all chapters from the semester syllabus.',
    { priority: 'high', reminder: '1day' },
  ),
]
