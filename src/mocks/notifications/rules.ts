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

import type { Permission } from '@/config/permissions'
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
   * Who should receive this, as permissions rather than role names.
   *
   * Permissions because roles are the school's data: this used to be
   * `['Admin', 'Principal']`, which was written before a school could invent
   * "Vice Principal" — and a fan-out on display names delivers nothing to a
   * role that did not exist when the rule was written. A permission asks what
   * the notification is *about*, which survives any role the school creates.
   *
   * An empty list means everyone. A rule that forgets to say who should hear
   * about something must over-deliver rather than silently reach nobody —
   * a notification nobody receives looks identical to a rule that never fired.
   */
  audience: Permission[]
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

/** Read a list of names off the payload. */
function list(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/**
 * "1A, 1B, 2A and 10 more" — enough to recognise, never the whole list.
 *
 * A digest that printed sixteen class names would be the wall of text it
 * replaced, on one line instead of sixteen. Three is enough to tell you what
 * kind of thing this is; the page behind the link has the rest, sortable and
 * current, which a notification body can never be.
 */
function summarise(names: string[], shown = 3): string {
  if (names.length <= shown) {
    if (names.length <= 1) return names[0] ?? ''
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  }
  return `${names.slice(0, shown).join(', ')} and ${names.length - shown} more`
}

/**
 * The audiences the rules below actually use.
 *
 * Each names the permission that makes the notification worth reading: you
 * hear about a fee because you can see finance, not because of your job title.
 *
 * Every rule below names one. A rule may pass `[]` for "everyone" — the store
 * treats that as unrestricted — but none needs to yet, and spelling out the
 * permission is what makes the fan-out reviewable.
 */
const SEES_FINANCE: Permission[] = ['finance.read']
const SEES_ATTENDANCE: Permission[] = ['attendance.read']
const SEES_GRADES: Permission[] = ['grades.read']
const SEES_STUDENTS: Permission[] = ['students.read']
const SEES_TEACHERS: Permission[] = ['teachers.read']
const SEES_NOTICES: Permission[] = ['notices.read']
const SEES_CALENDAR: Permission[] = ['calendar.read']
const SEES_TIMETABLE: Permission[] = ['timetable.read']
const MANAGES_NOTICES: Permission[] = ['notices.manage']
const MANAGES_SETTINGS: Permission[] = ['system.settings']

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
    audience: SEES_ATTENDANCE,
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
    audience: SEES_GRADES,
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
    audience: SEES_GRADES,
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
    audience: SEES_FINANCE,
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
    audience: SEES_FINANCE,
  }),

  // ── Notices ─────────────────────────────────────────────────────────
  'reimbursement.decided': event => {
    const decision = str(event.payload, 'decision')
    const approved = decision === 'Approved'
    return {
      category: 'finance',
      // A decline is not a failure of the system, but it is the one the
      // claimant needs to notice — money they expected is not coming.
      severity: approved ? 'success' : 'warning',
      title: `Reimbursement ${decision.toLowerCase()}`,
      body: `${str(event.payload, 'staffName')}'s claim for ₹${num(
        event.payload,
        'amount',
      ).toLocaleString('en-IN')} was ${decision.toLowerCase()} by ${str(
        event.payload,
        'decidedBy',
        'an administrator',
      )}.`,
      target: {
        kind: 'reimbursement',
        id: str(event.payload, 'requestId'),
        route: '/finance/expenses',
      },
      audience: SEES_FINANCE,
    }
  },

  'fees.reminder_sent': event => ({
    category: 'finance',
    severity: 'info',
    title: 'Payment reminder sent',
    body: `${str(event.payload, 'studentName')}'s guardian was reminded of ₹${num(
      event.payload,
      'amount',
    ).toLocaleString('en-IN')} outstanding.`,
    target: {
      kind: 'fee-reminder',
      id: str(event.payload, 'studentId'),
      route: '/finance/fees-collection',
    },
    audience: SEES_FINANCE,
  }),

  // ── Time-derived. Nobody did anything; a date passed. See `sweep.ts`. ──

  'fees.overdue': event => {
    const count = num(event.payload, 'count')
    const worstDaysLate = num(event.payload, 'worstDaysLate')
    const total = num(event.payload, 'totalAmount')
    const names = list(event.payload, 'names')
    const money = `₹${total.toLocaleString('en-IN')}`

    return {
      category: 'finance',
      // A week late is a different conversation from a day late, and in a
      // digest the worst one sets the tone.
      severity: worstDaysLate >= 7 ? 'critical' : 'warning',
      title:
        count === 1
          ? `Fee overdue — ${names[0] ?? 'a student'}`
          : `${count} fees overdue · ${money}`,
      body:
        count === 1
          ? `${money} for ${str(event.payload, 'feeCategory', 'fees')} is ${worstDaysLate} ${
              worstDaysLate === 1 ? 'day' : 'days'
            } past due (${str(event.payload, 'className')}).`
          : `${summarise(names)}. The oldest is ${worstDaysLate} days past due.`,
      target: { kind: 'fee-record', id: 'overdue', route: '/finance/fees-collection' },
      audience: SEES_FINANCE,
    }
  },

  'attendance.missing': event => {
    const count = num(event.payload, 'count')
    const classNames = list(event.payload, 'classNames')
    const cutoff = num(event.payload, 'cutoffHour', 10)

    return {
      category: 'attendance',
      severity: 'warning',
      title:
        count === 1
          ? `${classNames[0] ?? 'A class'} register not submitted`
          : `${count} registers not submitted`,
      body:
        count === 1
          ? `Nothing has been recorded for today, and it is past ${cutoff}:00.`
          : `${summarise(classNames)} have nothing recorded for today, and it is past ${cutoff}:00.`,
      target: { kind: 'attendance-register', id: 'missing', route: '/attendance/daily' },
      audience: SEES_ATTENDANCE,
    }
  },

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
    audience: SEES_NOTICES,
  }),

  'notice.pinned': event => ({
    category: 'notices',
    severity: 'warning',
    title: `Pinned — ${str(event.payload, 'title')}`,
    body: 'Moved to the top of the notice board',
    target: { kind: 'notice', id: str(event.payload, 'noticeId'), route: '/notice-board' },
    audience: SEES_NOTICES,
  }),

  // Deleting a notice is worth recording, but it has nowhere to link to.
  'notice.deleted': event => ({
    category: 'notices',
    severity: 'info',
    title: `Notice removed — ${str(event.payload, 'title')}`,
    target: null,
    audience: MANAGES_NOTICES,
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
    audience: SEES_CALENDAR,
  }),

  'calendar.event_cancelled': event => ({
    category: 'timetable',
    severity: 'warning',
    title: `Cancelled — ${str(event.payload, 'title')}`,
    body: str(event.payload, 'date'),
    target: null,
    audience: SEES_CALENDAR,
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
    audience: SEES_TIMETABLE,
  }),

  'timetable.exception_added': event => ({
    category: 'timetable',
    severity: 'warning',
    title: `Substitution — ${str(event.payload, 'className')}`,
    body: `${str(event.payload, 'subject')} on ${str(event.payload, 'date')}`,
    target: { kind: 'timetable', id: str(event.payload, 'exceptionId'), route: '/timetable' },
    audience: SEES_TIMETABLE,
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
    audience: SEES_STUDENTS,
  }),

  'students.promoted': event => ({
    category: 'people',
    severity: 'success',
    title: 'Promotion run completed',
    body: `${num(event.payload, 'promotedCount')} students promoted · ${num(event.payload, 'retainedCount')} retained`,
    target: { kind: 'promotion', id: str(event.payload, 'runId'), route: '/students/promotion' },
    audience: SEES_STUDENTS,
  }),

  'teacher.added': event => ({
    category: 'people',
    severity: 'success',
    title: `${str(event.payload, 'teacherName')} joined`,
    body: str(event.payload, 'department'),
    target: { kind: 'teacher', id: str(event.payload, 'teacherId'), route: '/teachers' },
    audience: SEES_TEACHERS,
  }),

  // ── System ──────────────────────────────────────────────────────────
  'settings.updated': event => ({
    category: 'system',
    severity: 'info',
    title: 'School settings updated',
    body: str(event.payload, 'section'),
    target: null,
    audience: MANAGES_SETTINGS,
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
