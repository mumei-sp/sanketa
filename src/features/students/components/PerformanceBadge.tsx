import { cn } from '@/lib/utils'
import { statusVivid } from '@/theme/colors'
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
 * Each level maps to the project-wide vivid status palette:
 *   Good          → success (green)
 *   Needs Support → warning (amber)
 *   At Risk       → danger  (red)
 *
 * Uses statusVivid.*.bg for pill background and statusVivid.*.color for the
 * label (and dot). Previously used status.*.soft which desaturated to grey.
 */
export function PerformanceBadge({ performance, variant = 'default', className }: PerformanceBadgeProps) {
  const statusMap: Record<StudentPerformance, typeof statusVivid.success> = {
    Good: statusVivid.success,
    'Needs Support': statusVivid.warning,
    'At Risk': statusVivid.danger,
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
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {variant === 'default' && (
        <div
          className="size-1.5 rounded-full"
          style={{ backgroundColor: s.color }}
        />
      )}
      <span className={variant === 'default' ? 'text-badge' : 'text-[11px] font-medium'}>
        {performance}
      </span>
    </div>
  )
}
