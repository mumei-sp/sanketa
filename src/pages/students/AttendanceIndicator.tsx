import { cn } from '@/lib/utils'
import { colors } from '@/theme/colors'

interface AttendanceIndicatorProps {
  value: number // 0-100
  size?: number // Optional, default = 40
  className?: string
}

// Visual constants (must not change)
const DEFAULT_SIZE = 20
const STROKE_WIDTH = 4.5
const BACKGROUND_COLOR = colors.border.default
const FILLED_COLOR = colors.primary.base
const RADIUS_RATIO = 0.4 // radius = size * 0.4

/**
 * Normalizes a value to be between 0 and 100
 */
function normalizeValue(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/**
 * Calculates the radius based on the component size
 */
function calculateRadius(size: number): number {
  return size * RADIUS_RATIO
}

/**
 * Calculates the stroke-dashoffset for the filled portion
 */
function calculateOffset(circumference: number, percentage: number): number {
  return circumference * (1 - percentage / 100)
}

/**
 * Donut chart component for displaying student attendance percentage
 * Shows a circular ring chart with light purple fill and percentage text
 */
export function AttendanceIndicator({
  value,
  size = DEFAULT_SIZE,
  className,
}: AttendanceIndicatorProps) {
  const normalizedValue = normalizeValue(value)
  const radius = calculateRadius(size)
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  // Calculate the arc length for the filled portion
  // Ensure minimum gap is at least stroke width to be visible with rounded caps
  const minGap = STROKE_WIDTH
  let filledLength: number
  let gapLength: number

  if (normalizedValue === 100) {
    // Full circle - no gap needed
    filledLength = circumference
    gapLength = 0
  } else {
    // For partial circles, ensure gap is visible (at least stroke width)
    const maxFilled = circumference - minGap
    filledLength = Math.min(maxFilled, (circumference * normalizedValue) / 100)
    gapLength = circumference - filledLength
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Donut Chart SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="flex-shrink-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
        aria-hidden="true"
      >
        {/* Background circle (unfilled portion) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={BACKGROUND_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Filled portion (light purple) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={FILLED_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={gapLength > 0 ? `${filledLength} ${gapLength}` : circumference}
          strokeLinecap={gapLength > 0 ? 'butt' : 'round'}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {/* Percentage text */}
      <span className="text-sm font-medium text-foreground">{Math.round(normalizedValue)}%</span>
    </div>
  )
}
