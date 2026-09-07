import * as React from 'react'
import { text, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { TimetableSlotCell } from './TimetableSlotCell'
import { resolveScheduleForDay } from '../utils/timetable-helpers'
import type { TimetableSlot, TimetableException, ResolvedSlot } from '../types'
import type { PeriodDefinition } from '@/config/school-config'
import { DAY_LABELS, DAY_SHORT_LABELS } from '../types'
import { TimetableDayList } from './TimetableDayList'

interface TimetableGridProps {
  periods: PeriodDefinition[]
  slots: TimetableSlot[]
  schoolDays: number[]
  exceptions?: TimetableException[]
  isEditMode: boolean
  onSlotClick?: (dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => void
}

/**
 * Bento-style timetable.
 *
 * Desktop (`lg` and up) renders the weekly grid: subject slots are rounded
 * colored cards, break rows are pill badges, period labels are compact.
 *
 * Below `lg` the same schedule renders as a single-day agenda — six columns of
 * ~140px cannot fit a phone or a portrait tablet, and side-scrolling a matrix
 * hides the day headings you are scrolling towards. See TimetableDayList.
 */
export function TimetableGrid({
  periods,
  slots,
  schoolDays,
  exceptions = [],
  isEditMode,
  onSlotClick,
}: TimetableGridProps) {
  // Track period numbering (excluding breaks)
  let periodNumber = 0

  // Resolve schedule for each day
  const resolvedDays = React.useMemo(() => {
    const result: Record<number, ResolvedSlot[]> = {}
    schoolDays.forEach(day => {
      result[day] = resolveScheduleForDay(periods, slots, day, exceptions)
    })
    return result
  }, [periods, slots, schoolDays, exceptions])

  return (
    <>
      {/* Phone / portrait tablet — one day at a time */}
      <div className="lg:hidden">
        <TimetableDayList
          schoolDays={schoolDays}
          resolvedDays={resolvedDays}
          isEditMode={isEditMode}
          onSlotClick={onSlotClick}
        />
      </div>

      {/* Desktop — the full week */}
      <div className="hidden overflow-x-auto rounded-lg lg:block">
      <table
        className="w-full border-separate"
        style={{
          borderSpacing: '0 4px',
          minWidth: `${(schoolDays.length + 1) * 140}px`,
          tableLayout: 'fixed',
        }}
      >
        {/* Header row — day names */}
        <thead>
          <tr>
            <th
              className="text-left text-[11px] font-semibold sticky left-0 z-10 rounded-tl-lg"
              style={{
                backgroundColor: background['table-header'],
                color: text.muted,
                padding: `${spacing['2.5']} ${spacing['3']}`,
                width: '90px',
                minWidth: '90px',
              }}
            >
              Period
            </th>

            {schoolDays.map((day, idx) => (
              <th
                key={day}
                className={`text-center text-[11px] font-semibold ${idx === schoolDays.length - 1 ? 'rounded-tr-lg' : ''}`}
                style={{
                  backgroundColor: background['table-header'],
                  color: 'var(--heading)',
                  padding: `${spacing['2.5']} ${spacing['2']}`,
                }}
              >
                <span className="hidden md:inline">{DAY_LABELS[day]}</span>
                <span className="md:hidden">{DAY_SHORT_LABELS[day]}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {periods.map((period) => {
            // Break rows — pill badge centered
            if (period.isBreak) {
              return (
                <tr key={period.id}>
                  <td
                    colSpan={schoolDays.length + 1}
                    style={{ padding: `${spacing['1']} 0` }}
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center rounded-full text-[11px] font-medium whitespace-nowrap"
                        style={{
                          padding: `${spacing['1']} ${spacing['4']}`,
                          backgroundColor: 'var(--accent)',
                          color: 'var(--heading)',
                        }}
                      >
                        {period.label} · {period.startTime} – {period.endTime}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            }

            periodNumber++

            return (
              <tr key={period.id}>
                {/* Period label — compact */}
                <td
                  className="sticky left-0 z-10"
                  style={{
                    backgroundColor: background.card,
                    padding: `${spacing['2']} ${spacing['2.5']}`,
                    width: '90px',
                    minWidth: '90px',
                  }}
                >
                  <div
                    className="text-xs font-bold leading-tight"
                    style={{ color: 'var(--heading)' }}
                  >
                    P{periodNumber}
                  </div>
                  <div
                    className="text-[10px] leading-tight mt-0.5"
                    style={{ color: text.muted, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {period.startTime} – {period.endTime}
                  </div>
                </td>

                {/* Day cells */}
                {schoolDays.map(day => {
                  const periodIdx = periods.indexOf(period)
                  const resolved = resolvedDays[day]?.[periodIdx]
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
    </>
  )
}
