import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from './attendance-types'
import { colors } from '@/theme/colors'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  className?: string
}

/**
 * Component to render attendance status badges as rounded filled pills
 * - Present: Green filled circle with white checkmark
 * - Late: Amber filled circle with white clock icon
 * - Absent: Red filled circle with white X
 * - N/A: Simple gray horizontal dash
 */
export function AttendanceStatusBadge({ status, className }: AttendanceStatusBadgeProps) {
  const baseClasses = 'w-6 h-6 rounded-full flex items-center justify-center'

  switch (status) {
    case 'present':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.success.base }}
          aria-label="Present"
        >
          <Check className="w-4 h-4 text-white" />
        </div>
      )
    case 'late':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.warning.base }}
          aria-label="Late"
        >
          <Clock className="w-4 h-4 text-white" />
        </div>
      )
    case 'absent':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.danger.base }}
          aria-label="Absent"
        >
          <X className="w-4 h-4 text-white" />
        </div>
      )
    case 'na':
      return (
        <div
          className={cn('flex items-center justify-center', className)}
          aria-label="Not applicable"
        >
          <div className="w-4 h-0.5" style={{ backgroundColor: colors.border.default }} />
        </div>
      )
    default:
      return null
  }
}
