import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tile } from '@/components/tile'
import type { StudentAttendanceStatus } from '../types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const STATUS_COLORS: Record<
  StudentAttendanceStatus,
  { bg: string; text: string }
> = {
  present: { bg: '#7EB8DA', text: '#ffffff' },
  late: { bg: '#E8A0B5', text: '#ffffff' },
  sick: { bg: '#15446E', text: '#ffffff' },
  absent: { bg: '#e5e7eb', text: '#374151' },
}

const STATUS_CONFIG: Record<StudentAttendanceStatus, { label: string; bgClass: string; textClass: string }> = {
  present: { label: 'Present', bgClass: 'bg-[#7EB8DA]', textClass: 'text-white' },
  late: { label: 'Late', bgClass: 'bg-[#E8A0B5]', textClass: 'text-white' },
  sick: { label: 'Sick', bgClass: 'bg-[#15446E]', textClass: 'text-white' },
  absent: { label: 'Absent', bgClass: 'bg-gray-200 border border-gray-400', textClass: 'text-gray-700' },
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export interface AttendanceCalendarProps {
  /** Per-day attendance (key: YYYY-MM-DD). Omit for empty calendar. */
  attendanceByDate?: Record<string, StudentAttendanceStatus>
  /** Tile width in grid columns (default 3) */
  tileWidth?: number
  tileLayoutMode?: 'grid' | 'block'
}

/**
 * Attendance calendar for student details: month view with prev/next,
 * color-coded days (Present / Late / Sick / Absent), and summary counts.
 */
export function AttendanceCalendar({
  attendanceByDate = {},
  tileWidth = 3,
  tileLayoutMode = 'grid',
}: AttendanceCalendarProps) {
  const [viewDate, setViewDate] = React.useState(() => new Date(2035, 2, 1)) // March 2035
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const prevMonth = React.useCallback(() => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }, [])
  const nextMonth = React.useCallback(() => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }, [])

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const leadingEmpty = firstDay
  const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7
  const trailingEmpty = totalCells - leadingEmpty - daysInMonth

  const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = []
  for (let i = 0; i < leadingEmpty; i++) {
    const d = new Date(year, month, -leadingEmpty + i + 1)
    cells.push({ date: d, isCurrentMonth: false, key: toDateKey(d) })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ date: d, isCurrentMonth: true, key: toDateKey(d) })
  }
  for (let i = 0; i < trailingEmpty; i++) {
    const d = new Date(year, month, daysInMonth + i + 1)
    cells.push({ date: d, isCurrentMonth: false, key: toDateKey(d) })
  }

  const counts = React.useMemo(() => {
    const c: Record<StudentAttendanceStatus, number> = {
      present: 0,
      late: 0,
      sick: 0,
      absent: 0,
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const key = toDateKey(new Date(year, month, day))
      const status = attendanceByDate[key]
      if (status && status in c) c[status] += 1
    }
    return c
  }, [year, month, daysInMonth, attendanceByDate])

  return (
    <Tile
      id="attendance-calendar-tile"
      layoutMode={tileLayoutMode}
      width={tileWidth}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-section-title">{monthLabel}</span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {/* Calendar grid: every cell gets explicit color/background so no date is invisible (no white overlap) */}
          <div className="grid w-full min-w-0 grid-cols-7 gap-1">
            {cells.map(({ date, isCurrentMonth, key }, i) => {
              const status = attendanceByDate[key]
              const colors = status ? STATUS_COLORS[status] : null
              const style: React.CSSProperties = colors
                ? { backgroundColor: colors.bg, color: colors.text }
                : isCurrentMonth
                  ? { backgroundColor: 'rgba(0,0,0,0.04)', color: '#15446e' }
                  : { backgroundColor: 'transparent', color: '#737373' }
              return (
                <div
                  key={`cal-${i}`}
                  className="flex min-h-6 min-w-6 items-center justify-center rounded text-xs font-medium sm:min-h-7 sm:min-w-7"
                  style={style}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['present', 'late', 'sick', 'absent'] as const).map(status => {
              const { label, bgClass, textClass } = STATUS_CONFIG[status]
              return (
                <div
                  key={status}
                  className={cn(
                    'flex items-center justify-between rounded px-2 py-1.5 text-xs font-medium',
                    bgClass,
                    textClass,
                  )}
                >
                  <span>{label}</span>
                  <span>{counts[status]}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
