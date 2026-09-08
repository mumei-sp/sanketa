/**
 * Notifications that nobody triggered.
 *
 * Every rule in `rules.ts` answers "someone did a thing — is that worth
 * telling anyone?". These answer a different question: *time passed and
 * something did not happen*. A fee falls overdue because a date went by. A
 * register is missing because nobody submitted it by mid-morning. No domain
 * event is ever emitted for those, so an event-driven feed is silent about
 * exactly the things a school most needs chasing.
 *
 * On a real backend this is a scheduled job — cron, a queue worker, whatever
 * the platform offers — reading the same tables and emitting the same events.
 * Here it runs in the browser on a timer, which is the wrong place for it and
 * says so: two open tabs would each sweep. The dedupe below makes that
 * harmless rather than correct, and the fix is the same as everywhere else in
 * `src/mocks/` — move it server-side.
 *
 * Firing at most once per subject per day is the whole trick. The condition
 * that produced the notification is still true the next time the sweep runs —
 * an overdue fee stays overdue — so without a key it would raise the same
 * alarm every few minutes until someone paid.
 */

import { feeCollectionData } from '@/mocks/fees'
import { availableClasses, getSubmissionForDate } from '@/mocks/attendance/daily'
import { publishDerived } from './store'

/** `2026-09-08` — the day part of a dedupe key. */
function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Parse the display dates the fee mock stores ('Mar 2, 2035').
 *
 * Returns null rather than an Invalid Date, so an unparseable row is skipped
 * instead of being reported as overdue since 1970.
 */
function parseDueDate(value: string): Date | null {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * After this hour, a class with no register is worth a nudge.
 *
 * Registers are taken first thing; a school that has not marked one by
 * mid-morning has forgotten rather than not got to it yet. A real deployment
 * would read this off the timetable's first period instead of a constant.
 */
const ATTENDANCE_CUTOFF_HOUR = 10

/** Fees whose due date has passed and which are not settled. */
function sweepOverdueFees(now: Date): number {
  const today = dayKey(now)
  let raised = 0

  feeCollectionData.forEach(record => {
    if (record.status === 'Paid') return
    const due = parseDueDate(record.dueDate)
    if (!due || due >= now) return

    const daysLate = Math.floor((now.getTime() - due.getTime()) / 86_400_000)
    const published = publishDerived(
      `fee-overdue:${record.studentId}:${record.feeCategory}:${today}`,
      {
        type: 'fees.overdue',
        payload: {
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.class,
          amount: record.totalAmount,
          daysLate,
          feeCategory: record.feeCategory,
        },
      },
    )
    if (published) raised += 1
  })

  return raised
}

/** Classes with no register submitted for today, once the morning is gone. */
function sweepMissingRegisters(now: Date): number {
  if (now.getHours() < ATTENDANCE_CUTOFF_HOUR) return 0
  // Weekends have no register to miss.
  const day = now.getDay()
  if (day === 0 || day === 6) return 0

  const today = dayKey(now)
  let raised = 0

  availableClasses.forEach(className => {
    if (getSubmissionForDate(className, today)) return
    const published = publishDerived(`register-missing:${className}:${today}`, {
      type: 'attendance.missing',
      payload: { className, date: today, cutoffHour: ATTENDANCE_CUTOFF_HOUR },
    })
    if (published) raised += 1
  })

  return raised
}

/**
 * Run every time-derived rule once.
 *
 * Returns how many notifications were raised, which is zero on nearly every
 * call — the interesting number is only non-zero the first time a day's
 * conditions are met.
 */
export function sweep(now: Date = new Date()): number {
  return sweepOverdueFees(now) + sweepMissingRegisters(now)
}
