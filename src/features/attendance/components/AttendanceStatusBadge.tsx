import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '../types'
import { colors } from '@/theme/colors'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  /**
   * `md` (24px) is the table cell's size. `sm` (16px) is for the compact day
   * cells of the mobile attendance strip, where a 24px circle would be most of
   * the cell.
   */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Component to render attendance status badges as rounded filled pills
 * - Present: Green filled circle with white checkmark
 * - Late: Amber filled circle with white clock icon
 * - Absent: Red filled circle with white X
 * - N/A: Simple gray horizontal dash
 */
export function AttendanceStatusBadge({ status, size = 'md', className }: AttendanceStatusBadgeProps) {
  const box = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  const glyph = size === 'sm' ? 'w-2.5 h-2.5' : 'w-4 h-4'
  const baseClasses = `${box} rounded-full flex items-center justify-center`

  switch (status) {
    case 'present':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.success.base }}
          aria-label="Present"
        >
          <Check className={cn(glyph, 'text-white')} />
        </div>
      )
    case 'late':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.warning.base }}
          aria-label="Late"
        >
          <Clock className={cn(glyph, 'text-white')} />
        </div>
      )
    case 'absent':
      return (
        <div
          className={cn(baseClasses, className)}
          style={{ backgroundColor: colors.status.danger.base }}
          aria-label="Absent"
        >
          <X className={cn(glyph, 'text-white')} />
        </div>
      )
    case 'na':
      return (
        <div
          className={cn('flex items-center justify-center', className)}
          aria-label="Not applicable"
        >
          <div className={cn(size === 'sm' ? 'w-2.5' : 'w-4', 'h-0.5')} style={{ backgroundColor: colors.border.default }} />
        </div>
      )
    default:
      return null
  }
}

