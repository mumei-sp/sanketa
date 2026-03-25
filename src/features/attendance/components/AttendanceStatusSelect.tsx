import { Check, Clock, X } from 'lucide-react'
import { colors } from '@/theme/colors'
import type { MarkableAttendanceStatus } from '../types'

interface AttendanceStatusSelectProps {
  /** Currently selected status (undefined = not yet marked) */
  value: MarkableAttendanceStatus | undefined
  /** Callback when status changes */
  onChange: (status: MarkableAttendanceStatus) => void
  /** Disable interaction */
  disabled?: boolean
}

const statusOptions: {
  value: MarkableAttendanceStatus
  label: string
  shortLabel: string
  icon: React.ReactNode
  color: string
  bgColor: string
}[] = [
  {
    value: 'present',
    label: 'Present',
    shortLabel: 'P',
    icon: <Check className="w-3.5 h-3.5" />,
    color: colors.status.success.base,
    bgColor: colors.status.success.soft,
  },
  {
    value: 'late',
    label: 'Late',
    shortLabel: 'L',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: colors.status.warning.base,
    bgColor: colors.status.warning.soft,
  },
  {
    value: 'absent',
    label: 'Absent',
    shortLabel: 'A',
    icon: <X className="w-3.5 h-3.5" />,
    color: colors.status.danger.base,
    bgColor: colors.status.danger.soft,
  },
]

/**
 * Reusable attendance status selector — renders 3 toggle buttons (P / L / A).
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
              backgroundColor: isSelected ? opt.bgColor : 'transparent',
              borderColor: isSelected ? opt.color : colors.border.default,
              color: isSelected ? opt.color : colors.text.muted,
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
