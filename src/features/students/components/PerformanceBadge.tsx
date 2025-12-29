import { cn } from '@/lib/utils'
import type { StudentPerformance } from '@/features/students/types'

interface PerformanceBadgeProps {
  performance: StudentPerformance
  className?: string
}

/**
 * Badge component for displaying student performance levels
 * Soft pastel badge with circular dot indicator
 * Uses exact Tailwind color values to match original design
 */
export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  // Using exact Tailwind color values to maintain original appearance
  // These match the original bg-blue-50, text-blue-700, bg-blue-500 etc.
  const variants = {
    Good: {
      background: '#EFF6FF', // blue-50
      text: '#1E40AF', // blue-700
    },
    'Needs Support': {
      background: '#F9FAFB', // gray-50
      text: '#374151', // gray-700
    },
    'At Risk': {
      background: '#FEF2F2', // red-50
      text: '#B91C1C', // red-700
    },
  }

  const dotColors = {
    Good: '#3B82F6', // blue-500
    'Needs Support': '#6B7280', // gray-500
    'At Risk': '#EF4444', // red-500
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

