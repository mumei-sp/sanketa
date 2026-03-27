import * as React from 'react'
import { text, background, border } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { TimetableSlotCell } from './TimetableSlotCell'
import { resolveScheduleForDay } from '../utils/timetable-helpers'
import type { TimetableSlot, TimetableException, ResolvedSlot } from '../types'
import type { PeriodDefinition } from '@/config/school-config'
import { DAY_LABELS, DAY_SHORT_LABELS } from '../types'

interface TimetableGridProps {
  /** Period definitions from config */
  periods: PeriodDefinition[]
  /** All weekly slots from the template */
  slots: TimetableSlot[]
  /** Active school days (e.g. [0,1,2,3,4] for Mon-Fri) */
  schoolDays: number[]
  /** Exceptions for overlay (optional, for a specific date range) */
  exceptions?: TimetableException[]
  /** Whether the grid is in edit mode */
  isEditMode: boolean
  /** Called when a slot cell is clicked in edit mode */
  onSlotClick?: (dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => void
}

/**
 * Main weekly timetable grid.
 * Rows = periods (including breaks), Columns = school days.
 * Desktop shows full grid, mobile/tablet gets horizontal scroll.
 */
export function TimetableGrid({
  periods,
  slots,
  schoolDays,
  exceptions = [],
  isEditMode,
  onSlotClick,
}: TimetableGridProps) {
  // Resolve schedule for each day
  const resolvedDays = React.useMemo(() => {
    const result: Record<number, ResolvedSlot[]> = {}
    schoolDays.forEach(day => {
      result[day] = resolveScheduleForDay(periods, slots, day, exceptions)
    })
    return result
  }, [periods, slots, schoolDays, exceptions])

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse"
        style={{ minWidth: `${(schoolDays.length + 1) * 130}px` }}
      >
        {/* Header row — day names */}
        <thead>
          <tr>
            {/* Period label column header */}
            <th
              className="text-left text-xs font-semibold sticky left-0 z-10"
              style={{
                backgroundColor: background.tableHeader,
                color: text.muted,
                padding: `${spacing['2.5']} ${spacing['3']}`,
                borderBottom: `1px solid ${border.default}`,
                minWidth: '100px',
              }}
            >
              Period
            </th>

            {/* Day column headers */}
            {schoolDays.map(day => (
              <th
                key={day}
                className="text-center text-xs font-semibold"
                style={{
                  backgroundColor: background.tableHeader,
                  color: text.heading,
                  padding: `${spacing['2.5']} ${spacing['3']}`,
                  borderBottom: `1px solid ${border.default}`,
                }}
              >
                <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
                <span className="sm:hidden">{DAY_SHORT_LABELS[day]}</span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body — one row per period */}
        <tbody>
          {periods.map((period, idx) => (
            <tr
              key={period.id}
              style={{
                borderBottom: idx < periods.length - 1 ? `1px solid ${border.subtle}` : undefined,
              }}
            >
              {/* Period label (sticky left column) */}
              <td
                className="sticky left-0 z-10"
                style={{
                  backgroundColor: period.isBreak ? border.subtle : background.card,
                  padding: `${spacing['1.5']} ${spacing['2']}`,
                  borderRight: `1px solid ${border.default}`,
                  minWidth: '100px',
                }}
              >
                <div
                  className="text-xs font-medium"
                  style={{ color: text.heading }}
                >
                  {period.label}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: text.muted }}
                >
                  {period.startTime} – {period.endTime}
                </div>
              </td>

              {/* Day cells */}
              {schoolDays.map(day => {
                const resolved = resolvedDays[day]?.[idx]
                if (!resolved) return <td key={day} />

                // Break rows span all day columns
                if (period.isBreak) {
                  if (day === schoolDays[0]) {
                    return (
                      <td
                        key={day}
                        colSpan={schoolDays.length}
                        className="text-center text-xs italic"
                        style={{
                          backgroundColor: border.subtle,
                          color: text.muted,
                          padding: `${spacing['1.5']} ${spacing['2']}`,
                        }}
                      >
                        {period.label}
                      </td>
                    )
                  }
                  return null // Other cells hidden by colSpan
                }

                return (
                  <TimetableSlotCell
                    key={day}
                    slot={resolved.slot}
                    isBreak={resolved.isBreak}
                    isCancelled={resolved.isCancelled}
                    isSubstitution={resolved.isSubstitution}
                    isExtraClass={resolved.isExtraClass}
                    exception={resolved.exception}
                    isEditMode={isEditMode}
                    onClick={() => onSlotClick?.(day, period.id, resolved.slot)}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
