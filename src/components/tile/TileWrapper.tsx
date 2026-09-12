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
  /**
   * How tiles sit in the cross axis of their row.
   *
   * `stretch` (the default, and CSS Grid's) makes every tile in a row as tall
   * as the tallest — which is what keeps a row of charts level, and is right
   * whenever the tiles in a row are meant to read as a set.
   *
   * `start` lets each tile keep its own height. Use it when a row holds tiles
   * of deliberately different sizes, so the short one shows a gap beneath it
   * rather than a stretched card with dead space inside.
   *
   * Not the default, though it is the safer-sounding one: measured on the
   * dashboard, `start` left the performance and gender charts 35px out of step
   * and the notice board 98px short of the activity feed. Stretch is the right
   * default; the thing that must not size a tile is its DATA, and that is what
   * `.tile-list` in `index.css` caps.
   */
  align?: 'stretch' | 'start'
  /** Child tiles */
  children: React.ReactNode
}

export function TileWrapper({
  columns = 12,
  gap = 8,
  align = 'stretch',
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
      className={cn('grid', columnsClass, align === 'start' && 'items-start', className)}
      style={{ ...style, gap: gapValue }}
      data-tile-wrapper="grid"
      {...props}
    >
      {children}
    </div>
  )
}
