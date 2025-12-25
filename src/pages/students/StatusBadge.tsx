import { cn } from '@/lib/utils'
import type { StudentStatus } from './student.types'

interface StatusBadgeProps {
  status: StudentStatus
  className?: string
}

/**
 * Pill-shaped badge component for displaying student status
 * Lightweight pill with soft background colors
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    Active: 'bg-green-50 text-green-700',
    'On Leave': 'bg-blue-50 text-blue-700',
  }

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-full px-3 text-xs font-medium',
        variants[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
