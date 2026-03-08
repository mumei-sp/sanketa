import * as React from 'react'
import { cn } from '@/lib/utils'
import { spacing, type SpacingKey } from '@/config/spacing'
import {
  type ResponsiveValue,
  resolveResponsiveClasses,
  responsiveGridColsMaps,
} from './tile-class-maps'

export interface TileWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid column count. Supports responsive: { default: 1, md: 12 } */
  columns?: ResponsiveValue<number>
  /** Gap between tiles (number in px, spacing key string, or rem string) */
  gap?: number | SpacingKey | string
  /** @deprecated Kept for backwards compat — always treated as 'grid' */
  mode?: 'grid' | 'flex'
  /** Child tiles */
  children: React.ReactNode
}

export function TileWrapper({
  columns = 12,
  gap = 8,
  mode: _mode,
  className,
  style,
  children,
  ...props
}: TileWrapperProps) {
  const gapValue = React.useMemo(() => {
    if (typeof gap === 'number') {
      return `${gap}px`
    }
    if (typeof gap === 'string' && gap in spacing) {
      return spacing[gap as SpacingKey]
    }
    return gap
  }, [gap])

  const columnsClass = resolveResponsiveClasses(columns, responsiveGridColsMaps)

  return (
    <div
      className={cn('grid', columnsClass, className)}
      style={{ ...style, gap: gapValue }}
      data-tile-wrapper="grid"
      {...props}
    >
      {children}
    </div>
  )
}
