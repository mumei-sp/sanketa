/**
 * Vidya Mandir's calendar.
 *
 * Fewer occasions than Kendriya's and different ones, because a school's
 * calendar is the least shareable thing it has. One shared list put the same
 * English Literature exam in Room 204 on the same morning at a school in
 * Bangalore and a school in Mysuru — and gave a Mysuru school no Dasara.
 *
 * Mysuru's year is not Bangalore's. Dasara closes the city for ten days and
 * the school with it; the Jumboo Savari procession is a school holiday and a
 * field trip both. Kannada Rajyotsava on the first of November is a working
 * day everywhere in the state and a morning of programmes in every school.
 */

import type { CalendarEvent } from '@/features/calendar/types'
import { calDay, createEvent, createAllDayEvent } from '../_generate/calendar'

export const calendarFixtures: CalendarEvent[] = [
  // ── Week 1 ────────────────────────────────────────────────────────────
  createEvent(
    'vm-evt-01', 'Half Yearly — Kannada', 'Academic',
    calDay(2), '09:30 AM', '11:30 AM',
    'Room 801', 'Third language paper. Dictionaries are not permitted.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'vm-evt-02', 'Staff Briefing — Dasara Arrangements', 'Administration',
    calDay(3), '03:30 PM', '04:15 PM',
    'Staff Room', 'Holiday roster, procession-day transport and exam rescheduling.',
    { priority: 'medium', attendees: 'All Teaching Staff' },
  ),

  // ── Week 2 ────────────────────────────────────────────────────────────
  createEvent(
    'vm-evt-03', 'Half Yearly — Mathematics', 'Academic',
    calDay(8), '09:30 AM', '12:00 PM',
    'Room 901', 'Log tables provided. Calculators are not allowed.',
    { priority: 'high', reminder: '1day' },
  ),
  createEvent(
    'vm-evt-04', 'Inter-house Throwball Final', 'Events',
    calDay(11), '08:00 AM', '10:30 AM',
    'School Ground', 'Houses Kaveri and Tunga in the final. Parents welcome.',
    { priority: 'low', attendees: 'Classes 6 to 10' },
  ),

  // ── Week 3 ────────────────────────────────────────────────────────────
  createEvent(
    'vm-evt-05', 'Parent-Teacher Meeting (Classes 1–5)', 'Events',
    calDay(13), '09:00 AM', '12:00 PM',
    'School Hall', 'Class teachers will be at their own classrooms after the hall session.',
    {
      description:
        'Half-yearly progress, reading levels and the switch to written examinations in Class 4.',
      priority: 'high',
      attendees: 'Parents of Classes 1 to 5',
    },
  ),
  createAllDayEvent(
    'vm-evt-06', 'Term 2 Fee — Last Date Without Penalty', 'Finance',
    calDay(16),
    'Accounts Office', 'Cheques accepted until 1 PM; online payment until midnight.',
    { priority: 'high', attendees: 'All Parents' },
  ),

  // ── Week 4 ────────────────────────────────────────────────────────────
  createEvent(
    'vm-evt-07', 'Field Visit — Mysuru Palace and Chamundi Hill', 'Events',
    calDay(19), '08:00 AM', '04:00 PM',
    'Assemble at the school gate', 'Consent forms and packed lunch are compulsory.',
    {
      description:
        'Classes 6 and 7, accompanied by four teachers. Two buses; the Chamundi Hill climb is optional.',
      priority: 'medium',
      attendees: 'Classes 6 & 7',
      reminder: '1day',
    },
  ),
  createEvent(
    'vm-evt-08', 'Kannada Rajyotsava Programme', 'Events',
    calDay(22), '09:00 AM', '11:00 AM',
    'School Hall', 'Assembly in Kannada, followed by songs and a short play by Class 8.',
    { priority: 'medium', attendees: 'Entire School' },
  ),

  // ── Week 5 ────────────────────────────────────────────────────────────
  createEvent(
    'vm-evt-09', 'Management Review — Half Yearly Results', 'Administration',
    calDay(26), '11:00 AM', '01:00 PM',
    'Principal’s Office', 'Class-wise results and the intervention list for Classes 9 and 10.',
    { priority: 'medium', attendees: 'Principal, Department Heads', reminder: '30min' },
  ),
]
