import * as React from 'react'
import { cn } from '@/lib/utils'
import { spacing, type SpacingKey } from '@/config/spacing'
import {
  type ResponsiveValue,
  resolveResponsiveClasses,
  responsiveColSpanMaps,
  responsiveRowSpanMaps,
  responsiveColStartMaps,
  responsiveColEndMaps,
  responsiveRowStartMaps,
  responsiveRowEndMaps,
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
  /** Grid column start position. Supports responsive: { lg: 9 } */
  colStart?: ResponsiveValue<number>
  /** Grid column end position. Supports responsive: { lg: 13 } */
  colEnd?: ResponsiveValue<number>
  /** Grid row start position. Supports responsive: { lg: 1 } */
  rowStart?: ResponsiveValue<number>
  /** Grid row end position. Supports responsive: { lg: 3 } */
  rowEnd?: ResponsiveValue<number>
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
  /** Applies the design system's card chrome — `--shadow-card` plus its hairline */
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

/**
 * A `padding` string is one of two different things, and only one is a class.
 *
 * A spacing key — `"3"` — is a token, resolved to a length by `getPaddingStyle`
 * below. Anything else is Tailwind (`"p-6"`, `"px-4 py-2"`) and belongs in the
 * class list. Returning the string unconditionally meant a spacing key was
 * emitted BOTH ways: the right padding as a style, and a junk `3` class beside
 * it. Harmless today only because every caller happens to pass a number or
 * Tailwind; a single `padding="3"` would have shipped the stray class.
 */
function getPaddingClass(padding?: number | SpacingKey | string): string {
  if (padding === undefined || typeof padding === 'number') return ''
  return padding in spacing ? '' : padding
}

/**
 * `padding === undefined`, not `!padding`: zero is a value.
 *
 * `padding={0}` used to fall into the falsy branch and set nothing at all — it
 * worked only because no ancestor gave a tile padding to cancel. The moment one
 * did, every `padding={0}` call site (the stat cards, the fee cards) would have
 * silently stopped meaning what it says.
 */
function getPaddingStyle(padding?: number | SpacingKey | string): React.CSSProperties {
  if (padding === undefined) return {}
  if (typeof padding === 'number') {
    return { padding: `${padding}px` }
  }
  if (padding in spacing) {
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
  colStart,
  colEnd,
  rowStart,
  rowEnd,
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

  // ── Grid-child classes: col-span/row-span/placement ──
  // Applied regardless of layoutMode since Tile can be a grid child in any mode
  const gridClasses = cn(
    resolveResponsiveClasses(width, responsiveColSpanMaps),
    resolveResponsiveClasses(height, responsiveRowSpanMaps),
    resolveResponsiveClasses(colStart, responsiveColStartMaps),
    resolveResponsiveClasses(colEnd, responsiveColEndMaps),
    resolveResponsiveClasses(rowStart, responsiveRowStartMaps),
    resolveResponsiveClasses(rowEnd, responsiveRowEndMaps),
  )

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

  // The design system's card chrome, not Tailwind's `shadow-xs` — which is a
  // flat *grey* `0 1px 2px rgb(0 0 0 / 0.05)` and reads dingy on this app's
  // cool canvas, leaving every tile sitting flat where the artboards have it
  // floating. `--shadow-card` is the two-layer navy-tinted lift they specify,
  // and `ui/card.tsx` already pairs it with the hairline `--card-border`.
  //
  // The border is not decoration: dark mode switches the shadow off entirely
  // (`--shadow-card: none`, because a shadow reads as mud on a dark surface),
  // so the hairline is the only thing left defining the card's edge.
  //
  // `className` merges last through `cn`/tailwind-merge, so a caller that
  // wants a different border or no shadow still wins.
  const shadowClass = shadowed ? 'shadow-card border border-card-border' : ''
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
      {...props}
      // After the spread, not before. These are the attributes the tile system
      // itself keys off — `data-tile-id` is how a tile is found in the DOM —
      // and with `props` spread last a caller passing one of them by hand could
      // overwrite the identity the component just established.
      data-tile-id={id}
      data-tile-layout={layoutMode}
      data-tile-nested={nested}
    >
      {children}
    </div>
  )
}
