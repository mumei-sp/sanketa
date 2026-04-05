import { cn } from '@/lib/utils'
import type { StudentPerformance } from '@/features/students/types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  className?: string
}

/**
 * Performance badge color definitions.
 *
 * Hand-tuned pastel palettes for each level — vibrant enough to be
 * instantly recognizable, soft enough to not overpower the table.
 */
const PERFORMANCE_COLORS: Record<StudentPerformance, { bg: string; text: string; dot: string }> = {
  Good: {
    bg: '#DCFCE7',     // green-100
    text: '#166534',    // green-800
    dot: '#22C55E',     // green-500
  },
  'Needs Support': {
    bg: '#FEF3C7',     // amber-100
    text: '#92400E',    // amber-800
    dot: '#F59E0B',     // amber-500
  },
  'At Risk': {
    bg: '#FEE2E2',     // red-100
    text: '#991B1B',    // red-800
    dot: '#EF4444',     // red-500
  },
}

/**
 * Badge component for displaying student performance levels.
 *
 * Standard across all pages: Students table, Promotion table/cards.
 * Import and reuse this component — do not duplicate the color definitions.
 */
export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  const c = PERFORMANCE_COLORS[performance]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        className,
      )}
      style={{
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      <div
        className="size-1.5 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      <span className="text-badge font-medium">{performance}</span>
    </div>
  )
}

/** Exported for reuse in Promotion components that render their own badge markup */
export { PERFORMANCE_COLORS }
