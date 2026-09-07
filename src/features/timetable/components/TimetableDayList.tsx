import * as React from 'react'
import { Pencil } from 'lucide-react'
import { text, border, status, withOpacity, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { getSubjectById } from '@/mocks/timetable/timetable'
import { cn } from '@/lib/utils'
import { DAY_LABELS, DAY_SHORT_LABELS } from '../types'
import type { ResolvedSlot, TimetableSlot } from '../types'

interface TimetableDayListProps {
  /** School days to offer in the day picker (0 = Monday) */
  schoolDays: number[]
  /** Resolved schedule per day, keyed by day index */
  resolvedDays: Record<number, ResolvedSlot[]>
  isEditMode: boolean
  onSlotClick?: (dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => void
}

/**
 * Single-day agenda view of the timetable.
 *
 * The weekly grid needs roughly 140px per column, so a six-day week wants
 * ~840px — it can only be reached by scrolling sideways on a phone or tablet,
 * which loses the day headings the moment you scroll. Below `lg` the week is
 * presented one day at a time instead: pick a day, read its periods top to
 * bottom. Same data, same edit affordances, no sideways scrolling.
 */
export function TimetableDayList({
  schoolDays,
  resolvedDays,
  isEditMode,
  onSlotClick,
}: TimetableDayListProps) {
  // Default to today when it is a school day, otherwise the first one.
  const [selectedDay, setSelectedDay] = React.useState(() => {
    // getDay() is Sunday-based; the timetable is Monday-based.
    const today = (new Date().getDay() + 6) % 7
    return schoolDays.includes(today) ? today : (schoolDays[0] ?? 0)
  })

  // A school-days change (config edit) can strand the selection on a day that
  // no longer exists.
  React.useEffect(() => {
    if (schoolDays.length > 0 && !schoolDays.includes(selectedDay)) {
      setSelectedDay(schoolDays[0])
    }
  }, [schoolDays, selectedDay])

  const daySchedule = resolvedDays[selectedDay] ?? []

  return (
    <div className="flex flex-col gap-3">
      {/* ── Day picker ── */}
      <div
        role="tablist"
        aria-label="Day of week"
        className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1"
      >
        {schoolDays.map(day => {
          const isActive = day === selectedDay
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedDay(day)}
              className="tap-target flex-1 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors"
              style={
                isActive
                  ? { backgroundColor: 'var(--heading)', color: background.card }
                  : {
                      backgroundColor: background.card,
                      color: 'var(--heading)',
                      border: `1px solid ${border.default}`,
                    }
              }
            >
              {DAY_SHORT_LABELS[day]}
            </button>
          )
        })}
      </div>

      {/* ── Periods for the selected day ── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-section-title" style={{ color: 'var(--heading)' }}>
          {DAY_LABELS[selectedDay]}
        </h3>

        {daySchedule.length === 0 ? (
          <p className="py-8 text-center text-body-muted" style={{ color: text.muted }}>
            No periods scheduled for {DAY_LABELS[selectedDay]}.
          </p>
        ) : (
          daySchedule.map((resolved, index) => (
            <DayPeriodRow
              key={resolved.period.id}
              resolved={resolved}
              // Breaks are not numbered, matching the grid's P1/P2 labelling.
              periodNumber={daySchedule.slice(0, index + 1).filter(r => !r.isBreak).length}
              isEditMode={isEditMode}
              onClick={() => onSlotClick?.(selectedDay, resolved.period.id, resolved.slot)}
            />
          ))
        )}
      </div>
    </div>
  )
}

/** One period in the day agenda — break pill, empty slot, or subject card. */
function DayPeriodRow({
  resolved,
  periodNumber,
  isEditMode,
  onClick,
}: {
  resolved: ResolvedSlot
  periodNumber: number
  isEditMode: boolean
  onClick: () => void
}) {
  const { period, slot, exception, isBreak, isCancelled, isSubstitution, isExtraClass } = resolved
  const timeRange = `${period.startTime} – ${period.endTime}`

  if (isBreak) {
    return (
      <div className="flex items-center justify-center">
        <span
          className="inline-flex items-center rounded-full text-[11px] font-medium"
          style={{
            padding: `${spacing['1']} ${spacing['4']}`,
            backgroundColor: 'var(--accent)',
            color: 'var(--heading)',
          }}
        >
          {period.label} · {timeRange}
        </span>
      </div>
    )
  }

  const isEmpty = !slot && !isExtraClass
  const subjectColor = slot ? (getSubjectById(slot.subjectId)?.color ?? 'var(--accent)') : 'var(--accent)'
  const tintColor = isSubstitution || isExtraClass ? 'var(--heading)' : subjectColor
  const interactive = isEditMode

  return (
    <div
      className={cn(
        'flex items-stretch gap-3 rounded-xl p-3 transition-all',
        interactive && 'cursor-pointer',
      )}
      style={{
        backgroundColor: isEmpty
          ? isEditMode
            ? withOpacity('var(--accent)', 0.15)
            : 'transparent'
          : withOpacity(tintColor, 0.1),
        border: isEmpty
          ? isEditMode
            ? '1.5px dashed var(--accent)'
            : `1px dashed ${border.default}`
          : isEditMode
            ? `1.5px dashed ${withOpacity(tintColor, 0.35)}`
            : `1px solid ${withOpacity(tintColor, 0.18)}`,
        opacity: isCancelled ? 0.45 : 1,
      }}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* Period + time rail */}
      <div className="flex w-[72px] shrink-0 flex-col justify-center">
        <span className="text-xs font-bold leading-tight" style={{ color: 'var(--heading)' }}>
          P{periodNumber}
        </span>
        <span
          className="text-[10px] leading-tight"
          style={{ color: text.muted, fontVariantNumeric: 'tabular-nums' }}
        >
          {timeRange}
        </span>
      </div>

      {/* Subject detail */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {isEmpty ? (
          <span className="text-body-muted" style={{ color: text.muted }}>
            {isEditMode ? '+ Add a subject' : 'Free period'}
          </span>
        ) : (
          <>
            <span
              className="text-body font-semibold leading-tight break-words"
              style={{
                color: 'var(--heading)',
                textDecoration: isCancelled ? 'line-through' : undefined,
              }}
            >
              {slot?.subjectName ?? exception?.newSubject ?? ''}
            </span>
            <span className="text-caption leading-tight break-words" style={{ color: text.muted }}>
              {slot?.teacherName ?? exception?.newTeacherName ?? ''}
            </span>
            {slot?.room && (
              <span
                className="mt-1.5 inline-block w-fit rounded-full text-[10px] font-medium leading-tight"
                style={{
                  color: 'var(--heading)',
                  backgroundColor: withOpacity(tintColor, 0.15),
                  padding: '2px 8px',
                }}
              >
                {slot.room}
              </span>
            )}
          </>
        )}
      </div>

      {/* Status affordance */}
      <div className="flex shrink-0 items-center">
        {isEditMode ? (
          <Pencil className="size-4" style={{ color: 'var(--heading)' }} />
        ) : (
          (isSubstitution || isExtraClass || isCancelled) && (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: isCancelled ? status.danger.base : 'var(--heading)' }}
              title={exception?.reason}
            />
          )
        )}
      </div>
    </div>
  )
}
