import * as React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { baseColors, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import type { CalendarEvent, CalendarViewType } from '../types'
import '../styles/fullcalendar-theme.css'

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onDatesChange?: (start: Date, end: Date) => void
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

function renderEventContent(eventInfo: EventContentArg) {
  const { event, view } = eventInfo
  const { startTimeDisplay, endTimeDisplay } = event.extendedProps

  if (view.type === 'dayGridMonth') {
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

export function CalendarView({
  events,
  onEventClick,
  onDateClick,
  onDatesChange,
  className,
}: CalendarViewProps) {
  const calendarRef = React.useRef<FullCalendar>(null)
  const [currentView, setCurrentView] = React.useState<CalendarViewType>('dayGridMonth')
  const [currentTitle, setCurrentTitle] = React.useState('')

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

  const handleDateClick = (info: DateClickArg) => {
    onDateClick(info.date)
  }

  const handleDatesSet = (info: DatesSetArg) => {
    updateTitle()
    onDatesChange?.(info.start, info.end)
  }

  return (
    <div className={cn('flex-1 min-w-0 bg-white rounded-xl p-4', className)}>
      {/* Custom Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        {/* Left: Month/Year navigation */}
        <div className="flex items-center gap-2">
          <h2
            className="text-base font-semibold flex items-center gap-1"
            style={{ color: baseColors.heading }}
          >
            {currentTitle}
            <ChevronDown className="w-4 h-4" />
          </h2>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
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
                    ? { backgroundColor: baseColors.heading, color: '#FFFFFF', fontWeight: 600 }
                    : { color: baseColors.heading, opacity: 0.55 }
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
            className="h-8 px-3 gap-1.5 text-xs font-medium rounded-lg border"
            style={{
              backgroundColor: baseColors.pink,
              borderColor: baseColors.pink,
              color: baseColors.heading,
            }}
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
        initialDate="2035-03-01"
        now="2035-03-12"
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        datesSet={handleDatesSet}
        dayMaxEvents={4}
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
