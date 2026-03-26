import { cn } from '@/lib/utils'
import { status, accent } from '@/theme/colors'
import type { StudentPerformance } from '@/features/students/types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  className?: string
}

/**
 * Badge component for displaying student performance levels
 * Soft pastel badge with circular dot indicator
 * Uses theme color tokens from colors.ts
 */
export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  const variants: Record<StudentPerformance, { background: string; text: string }> = {
    Good: {
      background: accent.soft,
      text: status.info.text,
    },
    'Needs Support': {
      background: status.info.soft,
      text: status.info.text,
    },
    'At Risk': {
      background: status.danger.soft,
      text: status.danger.text,
    },
  }

  const dotColors: Record<StudentPerformance, string> = {
    Good: status.success.base,
    'Needs Support': status.warning.base,
    'At Risk': status.danger.base,
  }

  const variant = variants[performance]
  const dotColor = dotColors[performance]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        className,
      )}
      style={{
        backgroundColor: variant.background,
        color: variant.text,
      }}
    >
      <div
        className="size-1.5 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-badge">{performance}</span>
    </div>
  )
}
