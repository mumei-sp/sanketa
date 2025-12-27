import { Check, X, Clock, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from './attendance-types'

interface AttendanceStatusIconProps {
  status: AttendanceStatus
  className?: string
}

/**
 * Component to render attendance status icons
 * - Present: Green checkmark (✓)
 * - Late: Yellow/orange clock icon
 * - Absent: Red X (✗)
 * - N/A: Grey dash (-)
 */
export function AttendanceStatusIcon({ status, className }: AttendanceStatusIconProps) {
  const baseClasses = 'size-4'

  switch (status) {
    case 'present':
      return (
        <Check
          className={cn(baseClasses, 'text-green-600 dark:text-green-400', className)}
          aria-label="Present"
        />
      )
    case 'late':
      return (
        <Clock
          className={cn(baseClasses, 'text-yellow-600 dark:text-yellow-400', className)}
          aria-label="Late"
        />
      )
    case 'absent':
      return (
        <X
          className={cn(baseClasses, 'text-red-600 dark:text-red-400', className)}
          aria-label="Absent"
        />
      )
    case 'na':
      return (
        <Minus
          className={cn(baseClasses, 'text-gray-400 dark:text-gray-500', className)}
          aria-label="Not applicable"
        />
      )
    default:
      return null
  }
}
