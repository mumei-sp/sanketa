import { cn } from '@/lib/utils'
import type { StudentPerformance } from './student.types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  className?: string
}

/**
 * Badge component for displaying student performance levels
 * Soft pastel badge with circular dot indicator
 */
export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  const variants = {
    Good: 'bg-blue-50 text-blue-700',
    'Needs Support': 'bg-gray-50 text-gray-700',
    'At Risk': 'bg-red-50 text-red-700',
  }

  const dotColors = {
    Good: 'bg-blue-500',
    'Needs Support': 'bg-gray-500',
    'At Risk': 'bg-red-500',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        variants[performance],
        className,
      )}
    >
      <div className={cn('size-1.5 rounded-full', dotColors[performance])} />
      <span className="text-xs font-medium">{performance}</span>
    </div>
  )
}
