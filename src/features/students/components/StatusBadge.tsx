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
  // Aligned with the project-wide `statusVivid` palette (Tailwind 50-tint bg / 800-tint text).
  const variants = {
    Active: 'bg-green-50 text-green-800',
    'On Leave': 'bg-blue-50 text-blue-800',
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

