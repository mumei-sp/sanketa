import * as React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { text, background } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { CalendarEvent, CalendarViewType } from '../types'
import '../styles/fullcalendar-theme.css'

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onDatesChange?: (start: Date, end: Date) => void
  onAddAgenda?: () => void
  className?: string
}

const VIEW_OPTIONS: { label: string; value: CalendarViewType }[] = [
  { label: 'Day', value: 'timeGridDay' },
  { label: 'Week', value: 'timeGridWeek' },
  { label: 'Month', value: 'dayGridMonth' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Event renderer for the calendar cells.
 *
 * A month grid gives each day roughly a seventh of the width — about 45px on a
 * phone, which is far too narrow for a title and breaks it mid-word. On those
 * widths the month view collapses to a time-and-dot chip; the day's full
 * schedule is one tap away in the details panel.
 */
function makeEventContent(isCompactMonth: boolean) {
  return function renderEventContent(eventInfo: EventContentArg) {
    const { event, view } = eventInfo
    const { startTimeDisplay, endTimeDisplay } = event.extendedProps

    if (view.type === 'dayGridMonth') {
      if (isCompactMonth) {
        // A day cell is ~45px wide here — even the start time truncates to
        // "09:…", which reads worse than nothing. A coloured bar keeps the
        // category and the day's density legible; the details panel has the rest.
        return <div className="h-1 w-full rounded-full bg-current opacity-60" />
      }

      const timeText = endTimeDisplay
        ? `${startTimeDisplay} – ${endTimeDisplay}`
        : startTimeDisplay

      return (
        <div className="flex flex-col w-full" style={{ lineHeight: 1.35 }}>
          <span className="font-medium" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {event.title}
          </span>
          <span className="opacity-70 mt-0.5" style={{ fontSize: '0.625rem' }}>
            {timeText}
          </span>
        </div>
      )
    }

    // Week/Day time grid views
    return (
      <div className="flex flex-col gap-0.5 p-0.5 overflow-hidden">
        <span className="font-medium text-xs truncate">{event.title}</span>
        <span className="text-[10px] opacity-70">
          {startTimeDisplay}{endTimeDisplay ? ` – ${endTimeDisplay}` : ''}
        </span>
      </div>
    )
  }
}

export function CalendarView({
  events,
  onEventClick,
  onDateClick,
  onDatesChange,
  onAddAgenda,
  className,
}: CalendarViewProps) {
  const calendarRef = React.useRef<FullCalendar>(null)
  const isMobile = useIsMobile()
  const eventContent = React.useMemo(() => makeEventContent(isMobile), [isMobile])
  const [currentView, setCurrentView] = React.useState<CalendarViewType>('dayGridMonth')
  const [currentTitle, setCurrentTitle] = React.useState('')
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false)
  const [pickerYear, setPickerYear] = React.useState(() => new Date().getFullYear())

  const updateTitle = React.useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    const date = api.getDate()
    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear()

    if (api.view.type === 'timeGridDay') {
      setCurrentTitle(`${month} ${date.getDate()}, ${year}`)
    } else {
      setCurrentTitle(`${month} ${year}`)
    }
  }, [])

  React.useEffect(() => {
    // Set initial title after mount
    const timer = setTimeout(updateTitle, 0)
    return () => clearTimeout(timer)
  }, [updateTitle])

  const handlePrev = () => {
    calendarRef.current?.getApi().prev()
    updateTitle()
  }

  const handleNext = () => {
    calendarRef.current?.getApi().next()
    updateTitle()
  }

  const handleViewChange = (view: CalendarViewType) => {
    calendarRef.current?.getApi().changeView(view)
    setCurrentView(view)
    updateTitle()
  }

  const handleMonthSelect = (monthIndex: number) => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.gotoDate(new Date(pickerYear, monthIndex, 1))
    updateTitle()
    setMonthPickerOpen(false)
  }

  const handlePickerOpen = () => {
    // Sync picker year with the calendar's current date
    const api = calendarRef.current?.getApi()
    if (api) setPickerYear(api.getDate().getFullYear())
  }

  const handleEventClick = (info: EventClickArg) => {
    const event = info.event
    onEventClick({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor || text.body,
      extendedProps: event.extendedProps as CalendarEvent['extendedProps'],
    })
  }

  const handleDateClick = (info: any) => {
    onDateClick(info.date)
  }

  const handleDatesSet = (info: DatesSetArg) => {
    updateTitle()
    onDatesChange?.(info.start, info.end)
  }

  return (
    <div
      className={cn('flex-1 min-w-0 rounded-xl p-4', className)}
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Custom Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        {/* Left: Month/Year navigation */}
        <div className="flex items-center gap-2">
          <Popover open={monthPickerOpen} onOpenChange={open => { setMonthPickerOpen(open); if (open) handlePickerOpen() }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="tap-target text-base font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: 'var(--heading)' }}
              >
                {currentTitle}
                <ChevronDown className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" style={{ width: '20rem' }} className="p-4">
              {/* Year navigation */}
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setPickerYear(y => y - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold" style={{ color: 'var(--heading)' }}>
                  {pickerYear}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setPickerYear(y => y + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {/* Month grid (3x4) */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, i) => {
                  const api = calendarRef.current?.getApi()
                  const currentDate = api?.getDate()
                  const isActive = currentDate
                    && currentDate.getMonth() === i
                    && currentDate.getFullYear() === pickerYear
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleMonthSelect(i)}
                      className={cn(
                        'h-9 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'text-white shadow-sm'
                          : 'hover:bg-accent hover:text-accent-foreground active:scale-95',
                      )}
                      style={isActive ? { backgroundColor: 'var(--heading)', color: background.card } : { color: 'var(--heading)' }}
                    >
                      {name.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="tap-target h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="tap-target h-7 w-7" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right: View toggles + Add Agenda */}
        <div className="flex items-center gap-2">
          {/* View toggle - hidden on mobile */}
          <div className="hidden md:flex items-center h-8 rounded-lg border border-border overflow-hidden">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleViewChange(opt.value)}
                className="px-3 h-full text-xs font-medium transition-colors"
                style={
                  currentView === opt.value
                    ? { backgroundColor: 'var(--heading)', color: background.card, fontWeight: 600 }
                    : { color: 'var(--heading)', opacity: 0.55 }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Add Agenda */}
          <Button
            variant="outline"
            size="sm"
            className="tap-target h-8 px-3 gap-1.5 text-xs font-medium rounded-lg border"
            style={{
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onClick={onAddAgenda}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Add Agenda</span>
          </Button>
        </div>
      </div>

      {/* FullCalendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={new Date().toISOString().slice(0, 10)}
        now={new Date().toISOString().slice(0, 10)}
        events={events}
        eventContent={eventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        datesSet={handleDatesSet}
        dayMaxEvents={isMobile ? 2 : 4}
        weekends={true}
        firstDay={0}
        height="auto"
        stickyHeaderDates={true}
        eventDisplay="block"
        dayHeaderFormat={{ weekday: 'short' }}
        slotMinTime="07:00:00"
        slotMaxTime="19:00:00"
      />
    </div>
  )
}
