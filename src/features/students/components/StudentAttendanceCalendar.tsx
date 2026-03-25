import { MiniCalendar } from '@/components/ui/mini-calendar'
import type { CalendarHighlight } from '@/components/ui/mini-calendar'
import { AttendanceSummaryBadges } from '@/components/ui/attendance-summary-badges'
import { spacing } from '@/config/spacing'
import { accent, primary, text, border, background } from '@/theme/colors'

interface AttendanceSummary {
  present: number
  late: number
  absent: number
  sick: number
}

interface StudentAttendanceCalendarProps {
  year: number
  month: number
  highlights: CalendarHighlight[]
  summary?: AttendanceSummary
  today?: number
  onMonthChange?: (year: number, month: number) => void
}

/**
 * StudentAttendanceCalendar - MiniCalendar with attendance stat badges below.
 * Uses shared AttendanceSummaryBadges for the colored pill indicators.
 */
export function StudentAttendanceCalendar({
  year,
  month,
  highlights,
  summary,
  today,
  onMonthChange,
}: StudentAttendanceCalendarProps) {
  return (
    <MiniCalendar
      year={year}
      month={month}
      highlights={highlights}
      today={today}
      onMonthChange={onMonthChange}
    >
      {summary && (
        <div style={{ marginTop: spacing['8'] }}>
          <AttendanceSummaryBadges
            items={[
              { label: 'Present', value: summary.present, color: accent.base },
              { label: 'Late', value: summary.late, color: primary.base },
              { label: 'Sick', value: summary.sick, color: text.heading, textColor: background.card },
              { label: 'Absent', value: summary.absent, color: border.default },
            ]}
          />
        </div>
      )}
    </MiniCalendar>
  )
}
