import * as React from 'react'
import { cn } from '@/lib/utils'
import { spacing, type SpacingKey } from '@/config/spacing'
import {
  type ResponsiveValue,
  resolveResponsiveClasses,
  responsiveColSpanMaps,
  responsiveRowSpanMaps,
} from './tile-class-maps'

export type LayoutMode = 'grid' | 'block'
export type OverflowMode = 'clip' | 'scroll' | 'auto' | 'hidden'
export type BackgroundToken =
  | 'default'
  | 'card'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'transparent'
export type BorderRadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface TileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Unique identifier */
  id: string
  /** Layout type */
  layoutMode?: LayoutMode
  /** Grid column span. Supports responsive: { default: 12, md: 8, lg: 6 } */
  width?: ResponsiveValue<number>
  /** Grid row span. Supports responsive: { default: 1, lg: 2 } */
  height?: ResponsiveValue<number>
  /** Explicit width (string like '100%' or number in px) */
  widthPx?: string | number
  /** Explicit height (string like '100%' or number in px) */
  heightPx?: string | number
  /** Pixel min width constraint */
  minWidthPx?: string | number
  /** Pixel max width constraint */
  maxWidthPx?: string | number
  /** Pixel min height constraint */
  minHeightPx?: string | number
  /** Pixel max height constraint */
  maxHeightPx?: string | number
  /** Disables entire tile & children */
  disabled?: boolean
  /** Pointer interaction control */
  interactable?: boolean
  /** Marks tile as containing nested tiles */
  nested?: boolean
  /** Pixel padding, spacing key, or Tailwind classes */
  padding?: number | SpacingKey | string
  /** Theme token or custom color */
  background?: string
  /** Theme token or CSS value */
  borderRadius?: string
  /** Applies shadow styles */
  shadowed?: boolean
  /** Overflow behavior */
  overflow?: OverflowMode
}

const backgroundTokenMap: Record<BackgroundToken, string> = {
  default: 'bg-background',
  card: 'bg-card',
  muted: 'bg-muted',
  accent: 'bg-accent',
  destructive: 'bg-destructive',
  transparent: 'bg-transparent',
}

const borderRadiusTokenMap: Record<BorderRadiusToken, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

const overflowMap: Record<OverflowMode, string> = {
  clip: 'overflow-clip',
  scroll: 'overflow-scroll',
  auto: 'overflow-auto',
  hidden: 'overflow-hidden',
}

function isBackgroundToken(value: string): value is BackgroundToken {
  return value in backgroundTokenMap
}

function isBorderRadiusToken(value: string): value is BorderRadiusToken {
  return value in borderRadiusTokenMap
}

function getBackgroundClass(background?: string): string {
  if (!background) return ''
  if (isBackgroundToken(background)) {
    return backgroundTokenMap[background]
  }
  return ''
}

function getBorderRadiusClass(borderRadius?: string): string {
  if (!borderRadius) return ''
  if (isBorderRadiusToken(borderRadius)) {
    return borderRadiusTokenMap[borderRadius]
  }
  return ''
}

function getPaddingClass(padding?: number | string): string {
  if (!padding) return ''
  if (typeof padding === 'number') {
    return ''
  }
  return padding
}

function getPaddingStyle(padding?: number | SpacingKey | string): React.CSSProperties {
  if (!padding) return {}
  if (typeof padding === 'number') {
    return { padding: `${padding}px` }
  }
  if (typeof padding === 'string' && padding in spacing) {
    return { padding: spacing[padding as SpacingKey] }
  }
  return {}
}

function toPx(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

export function Tile({
  id,
  layoutMode = 'grid',
  width,
  height,
  widthPx,
  heightPx,
  minWidthPx,
  maxWidthPx,
  minHeightPx,
  maxHeightPx,
  disabled = false,
  interactable = true,
  nested = false,
  padding,
  background,
  borderRadius,
  shadowed,
  overflow,
  className,
  style,
  children,
  ...props
}: TileProps) {
  const computedStyle: React.CSSProperties = { ...style }

  // ── Grid mode: width/height → Tailwind col-span/row-span classes ──
  let gridClasses = ''
  if (layoutMode === 'grid') {
    gridClasses = cn(
      resolveResponsiveClasses(width, responsiveColSpanMaps),
      resolveResponsiveClasses(height, responsiveRowSpanMaps),
    )
  }

  // ── Explicit pixel sizing (works for both modes) ──
  if (widthPx !== undefined) computedStyle.width = toPx(widthPx)
  if (heightPx !== undefined) computedStyle.height = toPx(heightPx)
  if (minWidthPx !== undefined) computedStyle.minWidth = toPx(minWidthPx)
  if (maxWidthPx !== undefined) computedStyle.maxWidth = toPx(maxWidthPx)
  if (minHeightPx !== undefined) computedStyle.minHeight = toPx(minHeightPx)
  if (maxHeightPx !== undefined) computedStyle.maxHeight = toPx(maxHeightPx)

  // ── Visual props ──
  const backgroundClass = getBackgroundClass(background)
  if (background && !isBackgroundToken(background)) {
    computedStyle.backgroundColor = background
  }

  const borderRadiusClass = getBorderRadiusClass(borderRadius)
  if (borderRadius && !isBorderRadiusToken(borderRadius)) {
    computedStyle.borderRadius = borderRadius
  }

  const paddingClass = getPaddingClass(padding)
  const paddingStyle = getPaddingStyle(padding)

  const shadowClass = shadowed ? 'shadow-xs' : ''
  const overflowClass = overflow ? overflowMap[overflow] : ''

  const pointerEventsDisabled = disabled || !interactable
  const disabledClass = disabled ? 'opacity-50' : ''
  const interactableClass = pointerEventsDisabled ? 'pointer-events-none' : ''

  return (
    <div
      id={id}
      className={cn(
        gridClasses,
        backgroundClass,
        borderRadiusClass,
        paddingClass,
        shadowClass,
        overflowClass,
        disabledClass,
        interactableClass,
        className,
      )}
      style={{
        ...computedStyle,
        ...paddingStyle,
      }}
      data-tile-id={id}
      data-tile-layout={layoutMode}
      data-tile-nested={nested}
      {...props}
    >
      {children}
    </div>
  )
}
