import * as React from 'react'
import { cn } from '@/lib/utils'

export type LayoutMode = 'grid' | 'flex' | 'absolute' | 'block'
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
  /** Grid columns (or px fallback) */
  width?: number
  /** Grid rows (or px fallback) */
  height?: number
  /** Explicit width for non-grid modes */
  widthPx?: string | number
  /** Explicit height for non-grid modes */
  heightPx?: string | number
  /** Grid min width constraint */
  minWidth?: number
  /** Grid max width constraint */
  maxWidth?: number
  /** Pixel min width constraint */
  minWidthPx?: string | number
  /** Pixel max width constraint */
  maxWidthPx?: string | number
  /** Grid min height constraint */
  minHeight?: number
  /** Grid max height constraint */
  maxHeight?: number
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
  /** Pixel padding or Tailwind classes */
  padding?: number | string
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

function getPaddingStyle(padding?: number | string): React.CSSProperties {
  if (!padding) return {}
  if (typeof padding === 'number') {
    return { padding: `${padding}px` }
  }
  return {}
}

export function Tile({
  id,
  layoutMode = 'grid',
  width,
  height,
  widthPx,
  heightPx,
  minWidth,
  maxWidth,
  minWidthPx,
  maxWidthPx,
  minHeight,
  maxHeight,
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
  // User styles applied first, computed styles will override
  const computedStyle: React.CSSProperties = {
    ...style,
  }

  // Layout mode styles
  if (layoutMode === 'grid') {
    if (width !== undefined) {
      computedStyle.gridColumn = `span ${width}`
    }
    if (height !== undefined) {
      computedStyle.gridRow = `span ${height}`
    }
    // In grid mode, pixel constraints take precedence over grid constraints
    // Only apply grid constraints if pixel constraints are not provided
    if (minWidth !== undefined && minWidthPx === undefined) {
      computedStyle.minWidth = `${minWidth}fr`
    }
    if (maxWidth !== undefined && maxWidthPx === undefined) {
      computedStyle.maxWidth = `${maxWidth}fr`
    }
    if (minHeight !== undefined && minHeightPx === undefined) {
      computedStyle.minHeight = `${minHeight}fr`
    }
    if (maxHeight !== undefined && maxHeightPx === undefined) {
      computedStyle.maxHeight = `${maxHeight}fr`
    }
  } else if (layoutMode === 'flex') {
    computedStyle.display = 'flex'
    // In non-grid modes, width/height act as px fallback
    if (width !== undefined && widthPx === undefined) {
      computedStyle.width = `${width}px`
    }
    if (height !== undefined && heightPx === undefined) {
      computedStyle.height = `${height}px`
    }
    // Constraints also act as px in non-grid modes
    if (minWidth !== undefined && minWidthPx === undefined) {
      computedStyle.minWidth = `${minWidth}px`
    }
    if (maxWidth !== undefined && maxWidthPx === undefined) {
      computedStyle.maxWidth = `${maxWidth}px`
    }
    if (minHeight !== undefined && minHeightPx === undefined) {
      computedStyle.minHeight = `${minHeight}px`
    }
    if (maxHeight !== undefined && maxHeightPx === undefined) {
      computedStyle.maxHeight = `${maxHeight}px`
    }
  } else if (layoutMode === 'absolute') {
    computedStyle.position = 'absolute'
    // In non-grid modes, width/height act as px fallback
    if (width !== undefined && widthPx === undefined) {
      computedStyle.width = `${width}px`
    }
    if (height !== undefined && heightPx === undefined) {
      computedStyle.height = `${height}px`
    }
    // Constraints also act as px in non-grid modes
    if (minWidth !== undefined && minWidthPx === undefined) {
      computedStyle.minWidth = `${minWidth}px`
    }
    if (maxWidth !== undefined && maxWidthPx === undefined) {
      computedStyle.maxWidth = `${maxWidth}px`
    }
    if (minHeight !== undefined && minHeightPx === undefined) {
      computedStyle.minHeight = `${minHeight}px`
    }
    if (maxHeight !== undefined && maxHeightPx === undefined) {
      computedStyle.maxHeight = `${maxHeight}px`
    }
  } else if (layoutMode === 'block') {
    computedStyle.display = 'block'
    // In non-grid modes, width/height act as px fallback
    if (width !== undefined && widthPx === undefined) {
      computedStyle.width = `${width}px`
    }
    if (height !== undefined && heightPx === undefined) {
      computedStyle.height = `${height}px`
    }
    // Constraints also act as px in non-grid modes
    if (minWidth !== undefined && minWidthPx === undefined) {
      computedStyle.minWidth = `${minWidth}px`
    }
    if (maxWidth !== undefined && maxWidthPx === undefined) {
      computedStyle.maxWidth = `${maxWidth}px`
    }
    if (minHeight !== undefined && minHeightPx === undefined) {
      computedStyle.minHeight = `${minHeight}px`
    }
    if (maxHeight !== undefined && maxHeightPx === undefined) {
      computedStyle.maxHeight = `${maxHeight}px`
    }
  }

  // Pixel sizing (explicit sizing takes precedence)
  if (widthPx !== undefined) {
    computedStyle.width = typeof widthPx === 'number' ? `${widthPx}px` : widthPx
  }
  if (heightPx !== undefined) {
    computedStyle.height = typeof heightPx === 'number' ? `${heightPx}px` : heightPx
  }

  // Pixel constraints (applied after grid constraints, so they override)
  if (minWidthPx !== undefined) {
    computedStyle.minWidth = typeof minWidthPx === 'number' ? `${minWidthPx}px` : minWidthPx
  }
  if (maxWidthPx !== undefined) {
    computedStyle.maxWidth = typeof maxWidthPx === 'number' ? `${maxWidthPx}px` : maxWidthPx
  }
  if (minHeightPx !== undefined) {
    computedStyle.minHeight = typeof minHeightPx === 'number' ? `${minHeightPx}px` : minHeightPx
  }
  if (maxHeightPx !== undefined) {
    computedStyle.maxHeight = typeof maxHeightPx === 'number' ? `${maxHeightPx}px` : maxHeightPx
  }

  // Background (custom colors use inline styles)
  const backgroundClass = getBackgroundClass(background)
  if (background && !isBackgroundToken(background)) {
    computedStyle.backgroundColor = background
  }

  // Border radius (custom values use inline styles)
  const borderRadiusClass = getBorderRadiusClass(borderRadius)
  if (borderRadius && !isBorderRadiusToken(borderRadius)) {
    computedStyle.borderRadius = borderRadius
  }

  // Padding
  const paddingClass = getPaddingClass(padding)
  const paddingStyle = getPaddingStyle(padding)

  // Shadow (using shadow-xs to match project style)
  const shadowClass = shadowed ? 'shadow-xs' : ''

  // Overflow
  const overflowClass = overflow ? overflowMap[overflow] : ''

  // Disabled and interactable states
  // Optimize: combine pointer-events logic to avoid duplicate classes
  const pointerEventsDisabled = disabled || !interactable
  const disabledClass = disabled ? 'opacity-50' : ''
  const interactableClass = pointerEventsDisabled ? 'pointer-events-none' : ''

  return (
    <div
      id={id}
      className={cn(
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
