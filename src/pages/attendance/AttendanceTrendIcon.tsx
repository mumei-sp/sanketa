import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceTrendIconProps {
  className?: string
  size?: number
}

/**
 * Trend icon component for attendance percentage badge
 * Icon is white on success color background
 */
export function AttendanceTrendIcon({ className, size = 12 }: AttendanceTrendIconProps) {
  return (
    <TrendingUp
      className={cn('text-white', className)}
      size={size}
      style={{ color: 'white' }}
      aria-hidden="true"
    />
  )
}
