import { cn } from '@/lib/utils'
import { status } from '@/theme/colors'
import type { StudentPerformance } from '@/features/students/types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  /** 'default' shows dot indicator + py-1; 'compact' is a smaller pill without dot */
  variant?: 'default' | 'compact'
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
export function PerformanceBadge({ performance, variant = 'default', className }: PerformanceBadgeProps) {
  const statusMap: Record<StudentPerformance, typeof status.success> = {
    Good: status.success,
    'Needs Support': status.warning,
    'At Risk': status.danger,
  }

  const s = statusMap[performance]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5',
        variant === 'default' ? 'gap-1.5 py-1' : 'py-0.5',
        className,
      )}
      style={{
        backgroundColor: s.soft,
        color: s.text,
      }}
    >
      {variant === 'default' && (
        <div
          className="size-1.5 rounded-full"
          style={{ backgroundColor: s.dot }}
        />
      )}
      <span className={variant === 'default' ? 'text-badge' : 'text-[11px] font-medium'}>
        {performance}
      </span>
    </div>
  )
}
