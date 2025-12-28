import * as React from 'react'
import { colors } from './colors'

/**
 * Chart gradient configuration
 * Defines the opacity values for chart gradients
 */
export const chartGradientConfig = {
  topOpacity: 0.45,
  bottomOpacity: 0.1,
} as const

/**
 * ChartGradient component - Renders a reusable SVG linear gradient for charts
 * 
 * @param id - Unique identifier for the gradient (required to avoid conflicts)
 * @param color - Base color for the gradient (defaults to primary.base)
 * @param topOpacity - Opacity at the top of the gradient (defaults to config value)
 * @param bottomOpacity - Opacity at the bottom of the gradient (defaults to config value)
 */
interface ChartGradientProps {
  id: string
  color?: string
  topOpacity?: number
  bottomOpacity?: number
}

export function ChartGradient({
  id,
  color = colors.primary.base,
  topOpacity = chartGradientConfig.topOpacity,
  bottomOpacity = chartGradientConfig.bottomOpacity,
}: ChartGradientProps): React.ReactElement {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={topOpacity} />
      <stop offset="100%" stopColor={color} stopOpacity={bottomOpacity} />
    </linearGradient>
  )
}
