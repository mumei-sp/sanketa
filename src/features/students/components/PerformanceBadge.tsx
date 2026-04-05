import { cn } from '@/lib/utils'
import { status } from '@/theme/colors'
import type { StudentPerformance } from '@/features/students/types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  className?: string
}

/**
 * Badge component for displaying student performance levels.
 *
 * Each level maps to a semantic status color:
 *   Good         → success (green)
 *   Needs Support → warning (amber)
 *   At Risk      → danger  (red)
 *
 * Uses .soft for background, .text for label, .dot for the indicator circle.
 */
export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  const statusMap: Record<StudentPerformance, typeof status.success> = {
    Good: status.success,
    'Needs Support': status.warning,
    'At Risk': status.danger,
  }

  const s = statusMap[performance]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        className,
      )}
      style={{
        backgroundColor: s.soft,
        color: s.text,
      }}
    >
      <div
        className="size-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
      />
      <span className="text-badge">{performance}</span>
    </div>
  )
}
