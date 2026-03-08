/**
 * Shared layout wrapper for grouping Tiles in a grid or flex layout.
 * Used by feature pages (students, attendance, teachers) and feature components; stays feature-agnostic (no feature imports). Responsive prop is optional so existing callers unchanged.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { spacing, type SpacingKey } from '@/config/spacing'

export interface TileWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid column count */
  columns?: number
  /** Gap between tiles (number in px, spacing key string, or rem string) */
  gap?: number | SpacingKey | string
  /** Wrapper layout mode */
  mode?: 'grid' | 'flex'
  /** When true: mobile = 1 column (tiles stack vertically); md+ = 12 columns. Use for detail/list pages so mobile doesn't overflow horizontally. */
  responsive?: boolean
  /** Child tiles */
  children: React.ReactNode
}

export function TileWrapper({
  columns = 12,
  gap = 8,
  mode = 'grid',
  responsive = false,
  className,
  style,
  children,
  ...props
}: TileWrapperProps) {
  // Convert gap to appropriate value
  // If it's a spacing key (string that exists in spacing config), use that value
  // If it's a number, treat as pixels
  // If it's already a string with units, use as-is
  const gapValue = React.useMemo(() => {
    if (typeof gap === 'number') {
      return `${gap}px`
    }
    if (typeof gap === 'string' && gap in spacing) {
      return spacing[gap as SpacingKey]
    }
    return gap
  }, [gap])

  // gap always in style so spacing applies in all modes. When responsive=true we don't set gridTemplateColumns here; Tailwind gridClass controls columns.
  const wrapperStyle: React.CSSProperties = {
    ...style,
    gap: gapValue,
    ...(mode === 'grid' && !responsive
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }
      : mode === 'grid' && responsive
        ? { display: 'grid' } // Columns come from gridClass (grid-cols-1 md:grid-cols-12), not inline
        : {
            display: 'flex',
          }),
  }

  // When responsive: 1 column on small screens (stack tiles), 12 columns from md breakpoint up. min-w-0 lets content shrink.
  const gridClass =
    mode === 'grid' && responsive
      ? 'grid-cols-1 md:grid-cols-12 min-w-0'
      : undefined

  return (
    <div
      className={cn(gridClass, className)}
      style={wrapperStyle}
      data-tile-wrapper={mode}
      data-tile-responsive={responsive || undefined}
      {...props}
    >
      {children}
    </div>
  )
}
