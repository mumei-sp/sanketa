/**
 * Notification rules — domain event in, notification out.
 *
 * This is *server* logic that happens to run in the browser while there is no
 * backend. It lives under `src/mocks/` rather than `src/features/` on purpose:
 * when the real backend arrives this file is what its team ports, and nothing
 * in the app should ever import it.
 *
 * Why the client must not do this job itself: a notification usually has an
 * audience wider than the person who triggered it. If the client authored
 * notifications, only the actor's own session would ever see one, every client
 * would carry a copy of the fan-out rules, and the rules would drift between
 * platforms. So services emit a plain `DomainEvent` and the decision of
 * "is this worth telling anyone, who, and how loudly" is made here.
 *
 * Adding an event: add a case to `RULES`. Returning `null` means the event is
 * real but not notification-worthy, which is a normal outcome — most domain
 * events are not.
 */

import type {
  DomainEvent,
  NotificationCategory,
  NotificationSeverity,
  NotificationTarget,
} from '@/features/notifications/types'

/** What a rule produces, before the store stamps id / timestamps on it. */
interface NotificationDraft {
  category: NotificationCategory
  severity: NotificationSeverity
  title: string
  body?: string
  target?: NotificationTarget | null
  /**
   * Roles that should receive this, as the real backend would compute.
   *
   * With one mocked user the audience is effectively always "you", so this
   * field changes nothing you can see today. It is computed anyway so the
   * shape is honest and the backend team inherits real intent rather than
   * having to invent it.
   */
  audience: string[]
}

type Rule = (event: DomainEvent) => NotificationDraft | null

/** Read a string off the loosely-typed event payload. */
function str(payload: Record<string, unknown>, key: string, fallback = ''): string {
  const value = payload[key]
  return typeof value === 'string' ? value : fallback
}

function num(payload: Record<string, unknown>, key: string, fallback = 0): number {
  const value = payload[key]
  return typeof value === 'number' ? value : fallback
}

const EVERYONE = ['Admin', 'Principal', 'Teacher', 'Staff']
const ADMINS = ['Admin', 'Principal']

const RULES: Record<string, Rule> = {
  // ── Attendance ──────────────────────────────────────────────────────
  'attendance.submitted': event => ({
    category: 'attendance',
    severity: 'success',
    title: `Attendance submitted for ${str(event.payload, 'className')}`,
    body: `${num(event.payload, 'presentCount')} present · ${num(event.payload, 'absentCount')} absent · ${str(event.payload, 'date')}`,
    target: {
      kind: 'attendance-submission',
      id: str(event.payload, 'submissionId'),
      route: `/attendance/daily?class=${str(event.payload, 'className')}&date=${str(event.payload, 'date')}`,
    },
    audience: ADMINS,
  }),

  // ── Grades ──────────────────────────────────────────────────────────
  'grades.drafted': event => ({
    category: 'grades',
    severity: 'info',
    title: `Draft saved — ${str(event.payload, 'subject')}, ${str(event.payload, 'className')}`,
    body: `${str(event.payload, 'examName')} · not yet submitted`,
    target: {
      kind: 'grade-submission',
      id: str(event.payload, 'submissionId'),
      route: `/grades/entry?class=${str(event.payload, 'className')}&exam=${str(event.payload, 'examId')}&subject=${str(event.payload, 'subjectId')}`,
    },
    audience: ADMINS,
  }),

  'grades.submitted': event => ({
    category: 'grades',
    severity: 'success',
    title: `Grades submitted — ${str(event.payload, 'subject')}, ${str(event.payload, 'className')}`,
    body: `${str(event.payload, 'examName')} · ${num(event.payload, 'entryCount')} students`,
    target: {
      kind: 'grade-submission',
      id: str(event.payload, 'submissionId'),
      route: `/grades/sheet?class=${str(event.payload, 'className')}&exam=${str(event.payload, 'examId')}`,
    },
    audience: ADMINS,
  }),

  // ── Finance ─────────────────────────────────────────────────────────
  'fees.payment_recorded': event => ({
    category: 'finance',
    severity: 'success',
    title: `Payment recorded — ${str(event.payload, 'studentName')}`,
    body: `${str(event.payload, 'amount')} · ${str(event.payload, 'method')}`,
    target: {
      kind: 'fee-payment',
      id: str(event.payload, 'paymentId'),
      route: '/finance/fees-collection',
    },
    audience: ADMINS,
  }),

  'expense.recorded': event => ({
    category: 'finance',
    severity: 'info',
    title: `Expense recorded — ${str(event.payload, 'category')}`,
    body: `${str(event.payload, 'amount')} · ${str(event.payload, 'vendor')}`,
    target: {
      kind: 'expense',
      id: str(event.payload, 'expenseId'),
      route: '/finance/expenses',
    },
    audience: ADMINS,
  }),

  // ── Notices ─────────────────────────────────────────────────────────
  'notice.published': event => ({
    category: 'notices',
    severity: str(event.payload, 'category') === 'Finance' ? 'warning' : 'info',
    title: str(event.payload, 'title'),
    body: `New notice for ${str(event.payload, 'audience', 'the school')}`,
    target: {
      kind: 'notice',
      id: str(event.payload, 'noticeId'),
      route: '/notice-board',
    },
    audience: EVERYONE,
  }),

  'notice.pinned': event => ({
    category: 'notices',
    severity: 'warning',
    title: `Pinned — ${str(event.payload, 'title')}`,
    body: 'Moved to the top of the notice board',
    target: { kind: 'notice', id: str(event.payload, 'noticeId'), route: '/notice-board' },
    audience: EVERYONE,
  }),

  // Deleting a notice is worth recording, but it has nowhere to link to.
  'notice.deleted': event => ({
    category: 'notices',
    severity: 'info',
    title: `Notice removed — ${str(event.payload, 'title')}`,
    target: null,
    audience: ADMINS,
  }),

  // ── Calendar ────────────────────────────────────────────────────────
  'calendar.event_created': event => ({
    category: 'timetable',
    severity: 'info',
    title: str(event.payload, 'title'),
    body: `${str(event.payload, 'category')} · ${str(event.payload, 'date')}`,
    target: {
      kind: 'calendar-event',
      id: str(event.payload, 'eventId'),
      route: '/calendar',
    },
    audience: EVERYONE,
  }),

  'calendar.event_cancelled': event => ({
    category: 'timetable',
    severity: 'warning',
    title: `Cancelled — ${str(event.payload, 'title')}`,
    body: str(event.payload, 'date'),
    target: null,
    audience: EVERYONE,
  }),

  // ── Timetable ───────────────────────────────────────────────────────
  'timetable.updated': event => ({
    category: 'timetable',
    severity: 'info',
    title: `Timetable updated — ${str(event.payload, 'className')}`,
    body: 'Periods were rearranged',
    target: {
      kind: 'timetable',
      id: str(event.payload, 'classSectionId'),
      route: '/timetable',
    },
    audience: EVERYONE,
  }),

  'timetable.exception_added': event => ({
    category: 'timetable',
    severity: 'warning',
    title: `Substitution — ${str(event.payload, 'className')}`,
    body: `${str(event.payload, 'subject')} on ${str(event.payload, 'date')}`,
    target: { kind: 'timetable', id: str(event.payload, 'exceptionId'), route: '/timetable' },
    audience: EVERYONE,
  }),

  // ── People ──────────────────────────────────────────────────────────
  'student.enrolled': event => ({
    category: 'people',
    severity: 'success',
    title: `${str(event.payload, 'studentName')} enrolled`,
    body: `Class ${str(event.payload, 'className')}`,
    target: {
      kind: 'student',
      id: str(event.payload, 'studentId'),
      route: `/students/details/${str(event.payload, 'studentId')}`,
    },
    audience: ADMINS,
  }),

  'students.promoted': event => ({
    category: 'people',
    severity: 'success',
    title: 'Promotion run completed',
    body: `${num(event.payload, 'promotedCount')} students promoted · ${num(event.payload, 'retainedCount')} retained`,
    target: { kind: 'promotion', id: str(event.payload, 'runId'), route: '/students/promotion' },
    audience: ADMINS,
  }),

  'teacher.added': event => ({
    category: 'people',
    severity: 'success',
    title: `${str(event.payload, 'teacherName')} joined`,
    body: str(event.payload, 'department'),
    target: { kind: 'teacher', id: str(event.payload, 'teacherId'), route: '/teachers' },
    audience: ADMINS,
  }),

  // ── System ──────────────────────────────────────────────────────────
  'settings.updated': event => ({
    category: 'system',
    severity: 'info',
    title: 'School settings updated',
    body: str(event.payload, 'section'),
    target: null,
    audience: ADMINS,
  }),
}

/**
 * Apply the rules to an event.
 *
 * Returns `null` for events nobody needs to hear about — an unknown type is
 * not an error, it just means no rule has been written for it yet.
 */
export function deriveNotification(event: DomainEvent): NotificationDraft | null {
  const rule = RULES[event.type]
  return rule ? rule(event) : null
}

export type { NotificationDraft }
