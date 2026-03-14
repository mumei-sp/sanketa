import { Calendar, Clock, MapPin, FileText } from 'lucide-react'
import { baseColors } from '@/theme/colors'
import { categoryConfig } from '../utils/category-config'
import type { CalendarEventExtendedProps } from '../types'

interface ScheduleDetailCardProps {
  title: string
  start: Date | string
  extendedProps: CalendarEventExtendedProps
}

export function ScheduleDetailCard({ title, start, extendedProps }: ScheduleDetailCardProps) {
  const { category, location, notes, startTimeDisplay, endTimeDisplay } = extendedProps
  const config = categoryConfig[category]

  const dateObj = typeof start === 'string' ? new Date(start) : start
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const timeText = endTimeDisplay
    ? `${startTimeDisplay} – ${endTimeDisplay}`
    : startTimeDisplay

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: config.backgroundColor }}
    >
      {/* Category badge */}
      <span
        className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70"
        style={{ color: config.borderColor }}
      >
        {category}
      </span>

      {/* Title */}
      <h4
        className="text-base font-bold leading-snug"
        style={{ color: baseColors.heading }}
      >
        {title}
      </h4>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: baseColors.heading }}>
          <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: baseColors.heading }}>
          <Clock className="w-3.5 h-3.5 shrink-0 opacity-60" />
          <span>{timeText}</span>
        </div>

        {location && (
          <div className="flex items-center gap-2 text-xs" style={{ color: baseColors.heading }}>
            <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <div className="rounded-lg p-2.5 bg-white/40">
          <div className="flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" style={{ color: baseColors.heading }} />
            <div>
              <span className="text-xs font-medium" style={{ color: baseColors.heading }}>Notes</span>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: baseColors.heading, opacity: 0.7 }}>
                {notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
