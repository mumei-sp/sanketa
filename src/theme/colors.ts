/**
 * Centralized Theme Color System
 *
 * Provides semantic color tokens derived from brand colors to ensure
 * consistent design across the application.
 */

// ============================================================================
// Base Brand Colors (Exact Values)
// ============================================================================

export const baseColors = {
  /** Primary brand color - Pink */
  pink: '#FECCFD',
  /** Accent brand color - Blue */
  blue: '#CDEAF0',
  /** Heading text color */
  heading: '#15446E',
} as const

// ============================================================================
// Color Manipulation Utilities
// ============================================================================

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s, l }
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

/**
 * Lighten a color by a percentage
 */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const newL = Math.min(1, hsl.l + amount / 100)
  const newRgb = hslToRgb(hsl.h, hsl.s, newL)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const newL = Math.max(0, hsl.l - amount / 100)
  const newRgb = hslToRgb(hsl.h, hsl.s, newL)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Desaturate a color by a percentage
 */
function desaturate(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const newS = Math.max(0, hsl.s - amount / 100)
  const newRgb = hslToRgb(hsl.h, newS, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Adjust opacity of a color (returns rgba string, or color-mix for CSS vars).
 *
 * Handles two cases:
 *  - Hex strings → rgba(r, g, b, opacity)
 *  - CSS var references like `var(--primary)` → color-mix(in srgb, ..., transparent)
 *    so the returned expression stays live when the CSS var updates.
 */
export function withOpacity(color: string, opacity: number): string {
  // Hex → rgba. Anything else (CSS var, color-mix, named color) goes through
  // color-mix so it stays reactive and composes cleanly.
  if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) {
    const rgb = hexToRgb(color)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
  }
  const pct = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`
}

/**
 * Generate color variants from a base color
 */
function generateColorVariants(baseColor: string) {
  return {
    base: baseColor,
    soft: lighten(desaturate(baseColor, 30), 15), // Very light, low saturation
    muted: '#F0F0F0', // Even lighter and more desaturated
    subtle: lighten(desaturate(baseColor, 50), 25), // Extremely subtle
    hover: lighten(baseColor, 5), // Slightly lighter on hover
    active: darken(baseColor, 5), // Slightly darker when active
  }
}

// ============================================================================
// Primary Colors (Pink-based)
// ============================================================================

export const primary = generateColorVariants(baseColors.pink)

// ============================================================================
// Accent Colors (Blue-based)
// ============================================================================

export const accent = generateColorVariants(baseColors.blue)

// ============================================================================
// Text Colors
// ============================================================================

export const text = {
  heading: baseColors.heading, // #15446E
  body: '#262626', // neutral-800 equivalent
  muted: '#00110B', // neutral-500 equivalent
} as const

// ============================================================================
// Background Colors
// ============================================================================

export const background = {
  page: '#F8F8F8', // Very light neutral background
  card: '#FFFFFF', // Pure white for cards
  surface: '#FFFFFF', // Surface elements
  highlight: lighten(desaturate(baseColors.blue, 40), 30), // Subtle highlight for selected rows
  sidebar: '#FFFFFF', // Sidebar background
  'sidebar-active': lighten(desaturate(baseColors.blue, 50), 25), // Active sidebar item
  'table-header': lighten(desaturate(baseColors.blue, 50), 28), // Table header background
} as const

// ============================================================================
// Border Colors
// ============================================================================

export const border = {
  default: '#E5E5E5', // neutral-200 equivalent
  subtle: '#F5F5F5', // neutral-100 equivalent
  muted: '#FAFAFA', // neutral-50 equivalent
} as const

// ============================================================================
// Status Colors (Pastel variants that blend with the UI)
// ============================================================================

/**
 * Generate pastel status colors that blend with the soft theme
 */
function generateStatusColor(baseHue: number, baseSaturation: number, baseLightness: number) {
  const rgb = hslToRgb(baseHue, baseSaturation, baseLightness)
  const baseHex = rgbToHex(rgb.r, rgb.g, rgb.b)
  return {
    base: baseHex,
    soft: lighten(desaturate(baseHex, 50), 20), // Very soft background
    muted: lighten(desaturate(baseHex, 60), 25), // Even softer
    text: darken(baseHex, 20), // Readable text on soft background
    dot: darken(baseHex, 10), // Dot indicator color
  }
}

export const status = {
  success: generateStatusColor(164, 0.52, 0.518), // Green - for "Active" (#44C4A1)
  info: generateStatusColor(205, 0.45, 0.6), // (#6FAFD6)
  warning: generateStatusColor(38, 0.85, 0.56), // Amber - for "Warning" (#F2A93B)
  danger: generateStatusColor(0, 0.965, 0.667), // Soft red - for "At Risk" (#FC5859)
} as const

// ============================================================================
// Vivid Status Pill Palette (Project-Wide)
// ============================================================================

/**
 * Vivid tint palette for status pills/badges — Tailwind 50-tint background
 * + Tailwind 800-tint text. Produces clearly hued, readable pills that stay
 * soft but avoid the washed-out greys produced by desaturating `status.*.soft`.
 *
 * Use this across the project wherever a status needs a colored pill:
 *   - success / active / paid / approved → statusVivid.success
 *   - warning / pending / on-leave       → statusVivid.warning
 *   - danger / inactive / overdue        → statusVivid.danger
 *   - info / scheduled / draft           → statusVivid.info
 *   - neutral / default / n/a            → statusVivid.neutral
 */
export const statusVivid = {
  success: { bg: '#F0FDF4', color: '#166534' }, // green-50 / green-800
  warning: { bg: '#FFFBEB', color: '#92400E' }, // amber-50 / amber-800
  danger:  { bg: '#FEF2F2', color: '#991B1B' }, // red-50 / red-800
  info:    { bg: '#EFF6FF', color: '#1E40AF' }, // blue-50 / blue-800
  neutral: { bg: '#F9FAFB', color: '#374151' }, // gray-50 / gray-700
} as const

export type StatusVividKey = keyof typeof statusVivid

// ============================================================================
// Delete / Destructive Action Colors
// ============================================================================

/**
 * Unified delete-action palette used for delete buttons, confirmation dialogs,
 * and dropdown menu items. Softer than raw red, consistent with the pastel theme.
 */
export const deleteAction = {
  /** Button / badge background */
  bg: status.danger.text, // #D64445 – rich but not screaming red
  /** Hover state for buttons */
  bgHover: darken(status.danger.text, 5), // slightly darker on hover
  /** Text color for inline delete labels & dropdown items */
  text: status.danger.text, // #D64445
  /** Soft tinted background for outlined/ghost delete buttons */
  soft: status.danger.soft, // very light red bg
  /** Muted background (icon containers, subtle highlights) */
  muted: status.danger.muted, // even lighter
} as const

// ============================================================================
// Complete Color System Export
// ============================================================================

export const colors = {
  primary,
  accent,
  text,
  background,
  border,
  status,
} as const

// ============================================================================
// TypeScript Types
// ============================================================================

export type ColorVariant = 'base' | 'soft' | 'muted' | 'subtle' | 'hover' | 'active'
export type StatusColor = keyof typeof status
export type BackgroundColor = keyof typeof background
export type BorderColor = keyof typeof border
export type TextColor = keyof typeof text

/**
 * Flattened color map for Tailwind configuration
 * All colors are accessible via semantic names
 */
export const tailwindColors = {
  // Primary colors
  primary: primary.base,
  'primary-soft': primary.soft,
  'primary-muted': primary.muted,
  'primary-subtle': primary.subtle,
  'primary-hover': primary.hover,
  'primary-active': primary.active,

  // Accent colors
  accent: accent.base,
  'accent-soft': accent.soft,
  'accent-muted': accent.muted,
  'accent-subtle': accent.subtle,
  'accent-hover': accent.hover,
  'accent-active': accent.active,

  // Text colors
  'text-heading': text.heading,
  'text-body': text.body,
  'text-muted': text.muted,

  // Background colors
  'bg-page': background.page,
  'bg-card': background.card,
  'bg-surface': background.surface,
  'bg-highlight': background.highlight,
  'bg-sidebar': background.sidebar,
  'bg-sidebar-active': background['sidebar-active'],
  'bg-table-header': background['table-header'],

  // Border colors
  'border-default': border.default,
  'border-subtle': border.subtle,
  'border-muted': border.muted,

  // Status colors
  'status-success': status.success.base,
  'status-success-soft': status.success.soft,
  'status-success-muted': status.success.muted,
  'status-success-text': status.success.text,
  'status-success-dot': status.success.dot,

  'status-info': status.info.base,
  'status-info-soft': status.info.soft,
  'status-info-muted': status.info.muted,
  'status-info-text': status.info.text,
  'status-info-dot': status.info.dot,

  'status-warning': status.warning.base,
  'status-warning-soft': status.warning.soft,
  'status-warning-muted': status.warning.muted,
  'status-warning-text': status.warning.text,
  'status-warning-dot': status.warning.dot,

  'status-danger': status.danger.base,
  'status-danger-soft': status.danger.soft,
  'status-danger-muted': status.danger.muted,
  'status-danger-text': status.danger.text,
  'status-danger-dot': status.danger.dot,
} as const
