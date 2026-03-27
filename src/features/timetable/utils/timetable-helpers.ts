/**
 * Timetable Utility Functions
 *
 * Pure functions for resolving timetable templates + exceptions.
 * No React dependency — fully testable.
 */

import type {
  TimetableSlot,
  TimetableException,
  ResolvedSlot,
} from '../types'
import type { PeriodDefinition } from '@/config/school-config'

/**
 * Get all slots for a specific day of the week from the template.
 */
export function getSlotsForDay(
  slots: TimetableSlot[],
  dayOfWeek: number,
): TimetableSlot[] {
  return slots.filter(s => s.dayOfWeek === dayOfWeek)
}

/**
 * Resolve a timetable template + exceptions for a specific day.
 *
 * For each period:
 * 1. Check if it's a break → mark as break, no slot
 * 2. Look up the template slot for this day/period
 * 3. Check if there's an exception override for this date/period
 * 4. Apply the exception (substitution replaces teacher, cancellation nulls the slot)
 *
 * @returns Array of ResolvedSlot in period order
 */
export function resolveScheduleForDay(
  periods: PeriodDefinition[],
  slots: TimetableSlot[],
  dayOfWeek: number,
  exceptions: TimetableException[],
  date?: string,
): ResolvedSlot[] {
  return periods.map(period => {
    // Breaks don't have slots
    if (period.isBreak) {
      return {
        period,
        slot: null,
        isBreak: true,
        isCancelled: false,
        isSubstitution: false,
        isExtraClass: false,
      }
    }

    const templateSlot = slots.find(
      s => s.dayOfWeek === dayOfWeek && s.periodId === period.id,
    ) ?? null

    // Check for exception on this date + period
    const exception = date
      ? exceptions.find(e => e.date === date && e.periodId === period.id)
      : undefined

    if (exception) {
      switch (exception.type) {
        case 'cancellation':
          return {
            period,
            slot: templateSlot,
            exception,
            isBreak: false,
            isCancelled: true,
            isSubstitution: false,
            isExtraClass: false,
          }

        case 'substitution':
          return {
            period,
            slot: templateSlot
              ? {
                  ...templateSlot,
                  subjectName: exception.newSubject ?? templateSlot.subjectName,
                  teacherName: exception.newTeacherName ?? templateSlot.teacherName,
                  teacherId: exception.newTeacher ?? templateSlot.teacherId,
                }
              : null,
            exception,
            isBreak: false,
            isCancelled: false,
            isSubstitution: true,
            isExtraClass: false,
          }

        case 'extra-class':
          return {
            period,
            slot: {
              dayOfWeek,
              periodId: period.id,
              subjectId: '',
              subjectName: exception.newSubject ?? 'Extra Class',
              teacherId: exception.newTeacher ?? '',
              teacherName: exception.newTeacherName ?? '',
              room: templateSlot?.room,
            },
            exception,
            isBreak: false,
            isCancelled: false,
            isSubstitution: false,
            isExtraClass: true,
          }
      }
    }

    return {
      period,
      slot: templateSlot,
      isBreak: false,
      isCancelled: false,
      isSubstitution: false,
      isExtraClass: false,
    }
  })
}

/**
 * Check if a teacher is already assigned to another class at the same day/period.
 * Used for conflict detection in the editor.
 */
export function hasTeacherConflict(
  allTimetables: { classSectionId: string; slots: TimetableSlot[] }[],
  teacherId: string,
  dayOfWeek: number,
  periodId: string,
  excludeClassId?: string,
): { hasConflict: boolean; conflictClass?: string } {
  for (const tt of allTimetables) {
    if (tt.classSectionId === excludeClassId) continue
    const conflict = tt.slots.find(
      s => s.teacherId === teacherId && s.dayOfWeek === dayOfWeek && s.periodId === periodId,
    )
    if (conflict) {
      return { hasConflict: true, conflictClass: tt.classSectionId }
    }
  }
  return { hasConflict: false }
}
