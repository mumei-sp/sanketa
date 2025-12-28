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
  /** Child tiles */
  children: React.ReactNode
}

export function TileWrapper({
  columns = 12,
  gap = 8,
  mode = 'grid',
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

  const wrapperStyle: React.CSSProperties = {
    ...style,
    ...(mode === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: gapValue,
        }
      : {
          display: 'flex',
          gap: gapValue,
        }),
  }

  return (
    <div className={cn(className)} style={wrapperStyle} data-tile-wrapper={mode} {...props}>
      {children}
    </div>
  )
}
