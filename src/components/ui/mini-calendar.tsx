import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, primary, accent, background, border } from '@/theme/colors'

export interface CalendarHighlight {
  date: number
  variant: 'present' | 'late' | 'onLeave' | 'absent' | 'sick'
}

interface MiniCalendarProps {
  /** Initial year (defaults to 2035 for mock) */
  year?: number
  /** Initial month (0-indexed, defaults to 2 = March) */
  month?: number
  /** Dates to highlight */
  highlights?: CalendarHighlight[]
  /** Today's date number (for current month highlighting) */
  today?: number
  /** Called when user navigates to a different month */
  onMonthChange?: (year: number, month: number) => void
  /** Content rendered below the calendar grid, inside the same card */
  children?: React.ReactNode
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/**
 * MiniCalendar - A generic, reusable mini calendar component.
 * Shows a compact month view with highlighted dates.
 * Can be used on any detail page or dashboard widget.
 */
export function MiniCalendar({
  year: initialYear = 2035,
  month: initialMonth = 2,
  highlights = [],
  today,
  onMonthChange,
  children,
}: MiniCalendarProps) {
  const [year, setYear] = React.useState(initialYear)
  const [month, setMonth] = React.useState(initialMonth)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // Build highlight lookup
  const highlightMap = new Map<number, CalendarHighlight>()
  highlights.forEach(h => highlightMap.set(h.date, h))

  const handlePrev = React.useCallback(() => {
    let newMonth = month
    let newYear = year
    if (month === 0) {
      newMonth = 11
      newYear = year - 1
    } else {
      newMonth = month - 1
    }
    setMonth(newMonth)
    setYear(newYear)
    onMonthChange?.(newYear, newMonth)
  }, [month, year, onMonthChange])

  const handleNext = React.useCallback(() => {
    let newMonth = month
    let newYear = year
    if (month === 11) {
      newMonth = 0
      newYear = year + 1
    } else {
      newMonth = month + 1
    }
    setMonth(newMonth)
    setYear(newYear)
    onMonthChange?.(newYear, newMonth)
  }, [month, year, onMonthChange])

  // Generate calendar grid cells
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  const title = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <h3
        style={{
          fontSize: fontSizes.lg,
          fontWeight: 600,
          color: text.heading,
          margin: 0,
        }}
      >
        {MONTH_NAMES[month]} {year}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['1'] }}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <SectionCard showDivider={false}>
      {title}
      <div style={{ marginTop: spacing['3'] }}>
        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: spacing['0.5'],
            marginBottom: spacing['2'],
          }}
        >
          {WEEKDAYS.map((day, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontSize: fontSizes.xs,
                fontWeight: 500,
                color: text.body,
                padding: spacing['1'],
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: spacing['0.5'],
          }}
        >
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />
            }

            const highlight = highlightMap.get(day)
            const isToday = day === today
            let bgColor: string = 'transparent'
            let textColor: string = text.body
            let fontWeight = 400

            if (highlight) {
              if (highlight.variant === 'present') {
                bgColor = accent.base
              } else if (highlight.variant === 'late') {
                bgColor = primary.base
              } else if (highlight.variant === 'onLeave') {
                bgColor = text.heading
                textColor = background.card
              } else if (highlight.variant === 'absent') {
                bgColor = border.default
                textColor = text.heading
              } else if (highlight.variant === 'sick') {
                bgColor = text.heading
                textColor = background.card
              }
              fontWeight = 600
            }

            if (isToday && !highlight) {
              bgColor = text.heading
              textColor = background.card
              fontWeight = 700
            }

            return (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: fontSizes.xs,
                  fontWeight,
                  color: textColor,
                  backgroundColor: bgColor,
                  borderRadius: spacing['2'],
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  cursor: 'default',
                }}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
      {children}
    </SectionCard>
  )
}
