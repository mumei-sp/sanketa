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
 * Firing at most once per day is the whole trick. The condition that produced
 * the notification is still true the next time the sweep runs — an overdue fee
 * stays overdue — so without a key it would raise the same alarm every few
 * minutes until someone paid.
 *
 * One notification per *rule*, not per subject
 * -------------------------------------------
 * The first version published one row per match, which is the obvious shape
 * and the wrong one. A school with sixteen class sections got sixteen
 * near-identical rows every morning — half the feed was one sentence with a
 * different class name in it, and the unread badge opened at twenty-three.
 * A count that is never near zero is decoration, and people stop reading it.
 *
 * So each rule now raises a single digest: the count, the total, and enough
 * names to recognise what it is about. The reader who needs the full list
 * follows the link to the page that already shows it — which is a better list
 * than a notification feed can ever be, because it is sortable and current.
 *
 * A digest of one still names its subject. "1 register not submitted" is a
 * worse sentence than "7A register not submitted", and the singular case is
 * common enough to be worth the branch.
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
  const overdue = feeCollectionData
    .filter(record => record.status !== 'Paid')
    .map(record => ({ record, due: parseDueDate(record.dueDate) }))
    .filter((entry): entry is { record: (typeof feeCollectionData)[number]; due: Date } => {
      return entry.due !== null && entry.due < now
    })

  if (overdue.length === 0) return 0

  const daysLate = (due: Date) => Math.floor((now.getTime() - due.getTime()) / 86_400_000)

  const published = publishDerived(`fees-overdue:${dayKey(now)}`, {
    type: 'fees.overdue',
    payload: {
      count: overdue.length,
      totalAmount: overdue.reduce((sum, entry) => sum + entry.record.totalAmount, 0),
      // The worst of them sets the tone: one fee three weeks late deserves the
      // same attention in a digest of four as it would have on its own.
      worstDaysLate: Math.max(...overdue.map(entry => daysLate(entry.due))),
      // Unique students, not one entry per record: the count is of *fees*,
      // and a student with two overdue items would otherwise be named twice
      // in a sentence meant to tell you who is involved.
      names: [...new Set(overdue.map(entry => entry.record.studentName))],
      // Only meaningful for a digest of one, where the rule names the subject.
      className: overdue[0].record.class,
      feeCategory: overdue[0].record.feeCategory,
    },
  })

  return published ? 1 : 0
}

/** Classes with no register submitted for today, once the morning is gone. */
function sweepMissingRegisters(now: Date): number {
  if (now.getHours() < ATTENDANCE_CUTOFF_HOUR) return 0
  // Weekends have no register to miss.
  const day = now.getDay()
  if (day === 0 || day === 6) return 0

  const today = dayKey(now)
  const missing = availableClasses.filter(className => !getSubmissionForDate(className, today))
  if (missing.length === 0) return 0

  const published = publishDerived(`registers-missing:${today}`, {
    type: 'attendance.missing',
    payload: {
      count: missing.length,
      classNames: missing,
      date: today,
      cutoffHour: ATTENDANCE_CUTOFF_HOUR,
    },
  })

  return published ? 1 : 0
}

/**
 * Run every time-derived rule once.
 *
 * Returns how many notifications were raised — at most one per rule, and zero
 * on nearly every call, since the day's digests go out the first time the
 * conditions are met and not again.
 */
export function sweep(now: Date = new Date()): number {
  return sweepOverdueFees(now) + sweepMissingRegisters(now)
}
