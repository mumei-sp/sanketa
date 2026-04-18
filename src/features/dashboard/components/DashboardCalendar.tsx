import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { cn } from '@/lib/utils'
import { baseColors, status } from '@/theme/colors'

export interface HighlightedDate {
  day: number
  color: string
}

interface CalendarProps {
  selectedDate?: Date
  highlightedDates?: HighlightedDate[]
  onDateSelect?: (date: Date) => void
  onMonthChange?: (date: Date) => void
  currentDate?: Date
  className?: string
  embedded?: boolean
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function DashboardCalendar({
  selectedDate,
  highlightedDates = [],
  onDateSelect,
  onMonthChange,
  currentDate: controlledDate,
  className,
  embedded = false,
}: CalendarProps) {
  const [internalDate, setInternalDate] = React.useState(() => selectedDate ?? new Date())
  const displayDate = controlledDate ?? internalDate
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const navigate = (newDate: Date) => {
    if (onMonthChange) {
      onMonthChange(newDate)
    } else {
      setInternalDate(newDate)
    }
  }

  const prevMonth = () => navigate(new Date(year, month - 1, 1))
  const nextMonth = () => navigate(new Date(year, month + 1, 1))

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selected = selectedDate?.getDate()
  const selectedMonth = selectedDate?.getMonth()
  const selectedYear = selectedDate?.getFullYear()

  const highlightMap = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const h of highlightedDates) {
      map.set(h.day, h.color)
    }
    return map
  }, [highlightedDates])

  function renderDayGrid() {
    return (
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((day, i) => (
          <div key={`header-${i}`} className="text-center text-caption text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }

          const isToday = isCurrentMonth && day === today.getDate()
          const isSelected = day === selected && month === selectedMonth && year === selectedYear
          const highlightColor = highlightMap.get(day)
          const isHighlighted = !!highlightColor
          const isSunday = (i % 7) === 0

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => onDateSelect?.(new Date(year, month, day))}
              className={cn(
                'relative flex items-center justify-center h-8 w-full text-xs rounded-md transition-colors',
                'hover:bg-white/50',
                isToday && 'font-bold',
                isSelected && 'text-white',
                isHighlighted && !isSelected && 'font-semibold',
              )}
              style={
                isSelected
                  ? { backgroundColor: 'var(--heading)', color: 'white' }
                  : isHighlighted
                    ? { backgroundColor: highlightColor, color: 'var(--heading)' }
                    : isSunday
                      ? { color: status.danger.base }
                      : undefined
              }
            >
              {day}
            </button>
          )
        })}
      </div>
    )
  }

  if (embedded) {
    return (
      <>
        <div className="flex items-center justify-between pb-2 px-4">
          <h3 className="text-section-title">{MONTHS[month]} {year}</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-white hover:bg-white/80" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-white hover:bg-white/80" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="px-4">
          {renderDayGrid()}
        </div>
      </>
    )
  }

  return (
    <Tile id="calendar-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className={cn('pt-4 pb-4 flex flex-col gap-0', className)}>
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">{MONTHS[month]} {year}</h3>
          <div className="flex items-center gap-1 col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0">
          {renderDayGrid()}
        </CardContent>
      </Card>
    </Tile>
  )
}
