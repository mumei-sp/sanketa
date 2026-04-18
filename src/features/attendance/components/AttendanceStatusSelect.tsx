import { Check, Clock, X } from 'lucide-react'
import { colors, baseColors, darken } from '@/theme/colors'
import type { MarkableAttendanceStatus } from '../types'

interface AttendanceStatusSelectProps {
  /** Currently selected status (undefined = not yet marked) */
  value: MarkableAttendanceStatus | undefined
  /** Callback when status changes */
  onChange: (status: MarkableAttendanceStatus) => void
  /** Disable interaction */
  disabled?: boolean
}

/**
 * Brand color mapping for attendance statuses.
 * Uses the project's brand palette (blue, pink, dark navy)
 * consistent with the student detail calendar colors.
 */
const statusOptions: {
  value: MarkableAttendanceStatus
  label: string
  shortLabel: string
  icon: React.ReactNode
  /** Border & text color when selected */
  color: string
  /** Background fill when selected */
  bgColor: string
  /** Text color override when selected (for dark backgrounds) */
  textColor?: string
}[] = [
  {
    value: 'present',
    label: 'Present',
    shortLabel: 'P',
    icon: <Check className="w-3.5 h-3.5" />,
    color: 'color-mix(in srgb, var(--accent) 85%, black)',
    bgColor: 'var(--accent)',
  },
  {
    value: 'late',
    label: 'Late',
    shortLabel: 'L',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'color-mix(in srgb, var(--primary) 80%, black)',
    bgColor: 'var(--primary)',
  },
  {
    value: 'absent',
    label: 'Absent',
    shortLabel: 'A',
    icon: <X className="w-3.5 h-3.5" />,
    color: 'var(--heading)',
    bgColor: 'var(--heading)',
    textColor: colors.background.card,
  },
]

/**
 * Reusable attendance status selector — renders 3 toggle buttons (P / L / A).
 * Uses brand colors: blue (present), pink (late), dark navy (absent).
 * Used in both the desktop table rows and mobile card view.
 */
export function AttendanceStatusSelect({
  value,
  onChange,
  disabled = false,
}: AttendanceStatusSelectProps) {
  return (
    <div className="flex items-center gap-1">
      {statusOptions.map(opt => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all border"
            style={{
              backgroundColor: isSelected ? opt.bgColor : colors.background.card,
              borderColor: isSelected ? opt.color : colors.border.default,
              color: isSelected ? (opt.textColor ?? opt.color) : 'var(--heading)',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            aria-label={opt.label}
            aria-pressed={isSelected}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.shortLabel}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Get status config for display purposes */
export function getStatusConfig(status: MarkableAttendanceStatus) {
  return statusOptions.find(o => o.value === status) ?? statusOptions[0]
}
