/**
 * Seeded notification history — what the feed looks like before you touch
 * anything.
 *
 * Timestamps are relative to load time rather than fixed dates, so the panel
 * always has something under "Today" and the relative labels ("2h ago") stay
 * sensible however long the branch sits unopened. Ordering is oldest-first
 * because the store stamps `seq` in array order.
 *
 * The mix is deliberate: every category appears at least once, and the newest
 * entries are the ones a user would most plausibly act on.
 *
 * Most of it is already read, which is what an app someone has been using
 * actually looks like. Seeding six unread rows made a fresh install open with
 * a badge in the high teens once the swept alerts landed on top — and a count
 * that is never near zero is decoration, because people stop reading it. Two
 * unread is enough to show the badge works.
 */

import type { Permission } from '@/config/permissions'
import type { Notification } from '@/features/notifications/types'

/**
 * A seeded row plus the audience its rule would have declared.
 *
 * The column arrived after these rows were written, and the store treats a row
 * with no audience as visible to everyone — the right default for real history
 * that predates the feature, but it made the seed misleading: every demo
 * account saw every seeded notification regardless of what it could reach.
 * Stating the audience here makes the starting feed behave like the ones the
 * rules produce.
 */
type SeededNotification = Notification & { audience: Permission[] }

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** ISO timestamp `ms` milliseconds before now. */
function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

/** Read `ms` after it arrived — keeps `readAt` plausibly after `createdAt`. */
function readAfter(createdAgo: number, delay: number): string {
  return new Date(Date.now() - createdAgo + delay).toISOString()
}

export const SEED_NOTIFICATIONS: SeededNotification[] = [
  {
    id: 'ntf-seed-01',
    category: 'system',
    severity: 'info',
    title: 'School settings updated',
    body: 'Academic Calendar',
    actor: { id: 'U-001', name: 'Surya Admin' },
    target: null,
    createdAt: ago(4 * DAY),
    readAt: readAfter(4 * DAY, 2 * HOUR),
    audience: ['system.settings'],
  },
  {
    id: 'ntf-seed-02',
    category: 'people',
    severity: 'success',
    title: 'Alicia Gomez enrolled',
    body: 'Class 8B',
    actor: { id: 'U-014', name: 'Registrar' },
    target: { kind: 'student', id: 'S-2102', route: '/students/details/S-2102' },
    createdAt: ago(3 * DAY),
    readAt: readAfter(3 * DAY, 40 * MINUTE),
    audience: ['students.read'],
  },
  {
    id: 'ntf-seed-03',
    category: 'finance',
    severity: 'success',
    title: 'Payment recorded — Thomas Green',
    body: '₹12,500 · UPI',
    actor: { id: 'U-021', name: 'Finance Office' },
    target: { kind: 'fee-payment', id: 'PAY-3301', route: '/finance/fees-collection' },
    createdAt: ago(2 * DAY + 5 * HOUR),
    readAt: readAfter(2 * DAY + 5 * HOUR, 3 * HOUR),
    audience: ['finance.read'],
  },
  {
    id: 'ntf-seed-04',
    category: 'timetable',
    severity: 'warning',
    title: 'Substitution — 9A',
    body: 'Mathematics on Sep 5',
    actor: { id: 'U-008', name: 'Meera Iyengar' },
    target: { kind: 'timetable', id: 'TTX-118', route: '/timetable' },
    createdAt: ago(2 * DAY),
    readAt: readAfter(2 * DAY, 30 * MINUTE),
    audience: ['timetable.read'],
  },
  {
    id: 'ntf-seed-05',
    category: 'notices',
    severity: 'info',
    title: 'Midterm Exam Timetable Released',
    body: 'New notice for Students (Grade 7–9)',
    actor: { id: 'U-003', name: 'Academic Office' },
    target: { kind: 'notice', id: 'nb-2', route: '/notice-board' },
    createdAt: ago(1 * DAY + 6 * HOUR),
    readAt: readAfter(1 * DAY + 6 * HOUR, 25 * MINUTE),
    audience: ['notices.read'],
  },
  {
    id: 'ntf-seed-06',
    category: 'grades',
    severity: 'success',
    title: 'Grades submitted — Science, 8B',
    body: 'Unit Test 1 · 32 students',
    actor: { id: 'U-011', name: 'Rahul Menon' },
    target: { kind: 'grade-submission', id: 'GS-441', route: '/grades/sheet?class=8B&exam=ut1' },
    createdAt: ago(1 * DAY + 2 * HOUR),
    readAt: readAfter(1 * DAY + 2 * HOUR, 30 * MINUTE),
    audience: ['grades.read'],
  },
  {
    id: 'ntf-seed-07',
    category: 'attendance',
    severity: 'success',
    title: 'Attendance submitted for 7A',
    body: '28 present · 2 absent · Sep 7',
    actor: { id: 'U-008', name: 'Meera Iyengar' },
    target: {
      kind: 'attendance-submission',
      id: 'ATT-902',
      route: '/attendance/daily?class=7A',
    },
    createdAt: ago(22 * HOUR),
    readAt: readAfter(22 * HOUR, 30 * MINUTE),
    audience: ['attendance.read'],
  },
  {
    id: 'ntf-seed-08',
    category: 'notices',
    severity: 'warning',
    title: 'Pinned — Fee Payment Reminder (Grade 9)',
    body: 'Moved to the top of the notice board',
    actor: { id: 'U-021', name: 'Finance Office' },
    target: { kind: 'notice', id: 'nb-6', route: '/notice-board' },
    createdAt: ago(5 * HOUR),
    readAt: readAfter(5 * HOUR, 30 * MINUTE),
    audience: ['notices.read'],
  },
  {
    id: 'ntf-seed-09',
    category: 'people',
    severity: 'success',
    title: 'Promotion run completed',
    body: '184 students promoted · 6 retained',
    actor: null,
    target: { kind: 'promotion', id: 'PR-2026', route: '/students/promotion' },
    createdAt: ago(3 * HOUR),
    readAt: null,
    audience: ['students.read'],
  },
  {
    id: 'ntf-seed-10',
    category: 'timetable',
    severity: 'info',
    title: 'Annual Sports Competition',
    body: 'Events · Sep 16, 2026',
    actor: { id: 'U-030', name: 'Sports Department' },
    target: { kind: 'calendar-event', id: 'EV-77', route: '/calendar' },
    createdAt: ago(40 * MINUTE),
    readAt: null,
    audience: ['calendar.read'],
  },
]
