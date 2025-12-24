import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TileWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid column count */
  columns?: number
  /** Gap between tiles (number in px or string) */
  gap?: number | string
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
  const gapValue = typeof gap === 'number' ? `${gap}px` : gap

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
