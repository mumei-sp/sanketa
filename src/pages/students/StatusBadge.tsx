import { cn } from '@/lib/utils'
import type { StudentStatus } from '@/features/students/types'

interface StatusBadgeProps {
  status: StudentStatus
  className?: string
  style?: React.CSSProperties
}

/**
 * Pill-shaped badge component for displaying student status
 * Lightweight pill with soft background colors
 */
export function StatusBadge({ status, className, style }: StatusBadgeProps) {
  const variants = {
    Active: 'bg-green-50 text-green-700',
    'On Leave': 'bg-blue-50 text-blue-700',
  }

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-full px-3 text-badge',
        variants[status],
        className,
      )}
      style={style}
    >
      {status}
    </span>
  )
}
