import * as React from 'react'
import { text, background, border } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { TimetableSlotCell } from './TimetableSlotCell'
import { resolveScheduleForDay } from '../utils/timetable-helpers'
import type { TimetableSlot, TimetableException, ResolvedSlot } from '../types'
import type { PeriodDefinition } from '@/config/school-config'
import { DAY_LABELS, DAY_SHORT_LABELS } from '../types'

interface TimetableGridProps {
  periods: PeriodDefinition[]
  slots: TimetableSlot[]
  schoolDays: number[]
  exceptions?: TimetableException[]
  isEditMode: boolean
  onSlotClick?: (dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => void
}

/**
 * Card-based timetable grid.
 *
 * Each slot is a white card with colored left border accent per subject.
 * Break rows are full-width muted bars.
 * Period labels in a sticky left column.
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
    <div className="overflow-x-auto rounded-lg">
      <table
        className="w-full border-separate"
        style={{
          borderSpacing: 0,
          minWidth: `${(schoolDays.length + 1) * 140}px`,
        }}
      >
        {/* Header row — day names */}
        <thead>
          <tr>
            {/* Period column header */}
            <th
              className="text-left text-xs font-semibold sticky left-0 z-10 rounded-tl-lg"
              style={{
                backgroundColor: background.tableHeader,
                color: text.muted,
                padding: `${spacing['3']} ${spacing['3']}`,
                width: '110px',
                minWidth: '110px',
              }}
            >
              Period
            </th>

            {/* Day column headers */}
            {schoolDays.map((day, idx) => (
              <th
                key={day}
                className={`text-center text-xs font-semibold ${idx === schoolDays.length - 1 ? 'rounded-tr-lg' : ''}`}
                style={{
                  backgroundColor: background.tableHeader,
                  color: text.heading,
                  padding: `${spacing['3']} ${spacing['2']}`,
                }}
              >
                <span className="hidden md:inline">{DAY_LABELS[day]}</span>
                <span className="md:hidden">{DAY_SHORT_LABELS[day]}</span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body — one row per period */}
        <tbody>
          {periods.map((period, idx) => {
            const isLast = idx === periods.length - 1

            // Break rows span all columns
            if (period.isBreak) {
              return (
                <tr key={period.id}>
                  <td
                    colSpan={schoolDays.length + 1}
                    className={isLast ? 'rounded-b-lg' : ''}
                    style={{
                      backgroundColor: border.subtle,
                      padding: `${spacing['2']} ${spacing['3']}`,
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="h-px flex-1"
                        style={{ backgroundColor: border.default }}
                      />
                      <span
                        className="text-[11px] font-medium whitespace-nowrap"
                        style={{ color: text.muted }}
                      >
                        {period.label} · {period.startTime} – {period.endTime}
                      </span>
                      <div
                        className="h-px flex-1"
                        style={{ backgroundColor: border.default }}
                      />
                    </div>
                  </td>
                </tr>
              )
            }

            return (
              <tr key={period.id}>
                {/* Period label — sticky left */}
                <td
                  className={`sticky left-0 z-10 ${isLast ? 'rounded-bl-lg' : ''}`}
                  style={{
                    backgroundColor: background.page,
                    padding: `${spacing['1.5']} ${spacing['2.5']}`,
                    borderRight: `1px solid ${border.subtle}`,
                    width: '110px',
                    minWidth: '110px',
                  }}
                >
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{ color: text.heading }}
                  >
                    {period.label}
                  </div>
                  <div
                    className="text-[10px] leading-tight mt-0.5"
                    style={{ color: text.muted }}
                  >
                    {period.startTime} – {period.endTime}
                  </div>
                </td>

                {/* Day cells — card-style slots */}
                {schoolDays.map(day => {
                  const resolved = resolvedDays[day]?.[idx]
                  if (!resolved) return <td key={day} />

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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
