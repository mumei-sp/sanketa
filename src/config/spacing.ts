/**
 * Compact Spacing Configuration
 *
 * This file provides a uniform, compact spacing scale for dashboard-optimized density.
 * Spacing values are reduced by approximately one Tailwind step to improve
 * information density while maintaining visual clarity.
 *
 * All values are in rem units, relative to the 14px root this app sets in
 * `index.css`. The px in each comment is what that token actually renders.
 *
 * This is the SINGLE SOURCE OF TRUTH for all spacing values in the application.
 * All spacing (Tailwind classes, inline styles, CSS variables) should reference this config.
 *
 * ── The rem values were a step short of their own comments ─────────────
 * They were written as though the root were 16px: `'4': '1rem'` annotated
 * "16px", which at a 14px root is 14. Every token in the scale landed 12.5%
 * under what it said, and because the whole app spaces itself through here, so
 * did every card, gap and inset in it — on top of the compact reduction below,
 * which was deliberate and is still applied.
 *
 * Nothing was obviously broken, which is why it lasted: a uniform shortfall
 * reads as a house style rather than a bug. It surfaced when the Access screen
 * was measured against a design drawn at 16px-root spacing and came up short
 * everywhere at once, by the same 12.5%.
 *
 * `typography.ts` never had this problem — it states `1.143rem` for 16px, the
 * root correctly accounted for. This file now matches that convention.
 *
 * Formula: intended px ÷ 14 (the root), where the intended px is the original
 * Tailwind value * 0.875 * 0.9-0.95 (the compact reduction).
 */

/**
 * Compact spacing scale
 * Maps Tailwind spacing tokens to reduced values (down by ~1 step)
 *
 * Conversion: Original Tailwind value * 0.875 (14px/16px base ratio)
 * Then further reduced by ~10-15% for compact density
 */
export const spacing = {
  // Pixel-based spacing
  px: '1px', // 1px

  // Ultra compact (0-1)
  '0': '0',
  '0.5': '0.143rem', // 2px
  '1': '0.286rem', // 4px

  // Small spacing (1.5-3)
  '1.5': '0.429rem', // 6px
  '2': '0.571rem', // 8px
  '2.5': '0.714rem', // 10px
  '3': '0.857rem', // 12px

  // Medium spacing (4-6)
  '4': '1.143rem', // 16px
  '5': '1.286rem', // 18px
  '6': '1.429rem', // 20px

  // Extended medium spacing (7-11)
  '7': '1.571rem', // 22px
  '9': '1.857rem', // 26px
  '11': '2.143rem', // 30px

  // Large spacing (8-14)
  '8': '1.714rem', // 24px
  '10': '2rem', // 28px
  '12': '2.286rem', // 32px
  '14': '2.571rem', // 36px

  // Extra large spacing (16-28)
  '16': '2.857rem', // 40px
  '20': '3.429rem', // 48px
  '24': '4rem', // 56px
  '28': '4.571rem', // 64px

  // Huge spacing (32-48)
  '32': '5.143rem', // 72px
  '36': '5.714rem', // 80px
  '40': '6.286rem', // 88px
  '44': '6.857rem', // 96px
  '48': '7.429rem', // 104px

  // Extra huge spacing (52-64)
  '52': '8rem', // 112px
  '56': '8.571rem', // 120px
  '60': '9.143rem', // 128px
  '64': '9.714rem', // 136px

  // Maximum spacing (72-96)
  '72': '10.857rem', // 152px
  '80': '12rem', // 168px
  '96': '14.857rem', // 208px
} as const

/**
 * Semantic spacing roles for common use cases
 * Use these for semantic meaning rather than arbitrary values
 */
export const spacingRoles = {
  /** Compact spacing for tight layouts (tables, dense lists, data grids) */
  compact: {
    xs: spacing['1'], // 4px
    sm: spacing['2'], // 8px
    md: spacing['3'], // 12px
    lg: spacing['4'], // 16px
  },

  /** Normal spacing for standard layouts (cards, forms, content sections) */
  normal: {
    xs: spacing['2'], // 8px
    sm: spacing['3'], // 12px
    md: spacing['4'], // 16px
    lg: spacing['6'], // 20px
  },

  /** Relaxed spacing for spacious layouts (landing pages, hero sections, wide content) */
  relaxed: {
    xs: spacing['4'], // 16px
    sm: spacing['6'], // 20px
    md: spacing['8'], // 24px
    lg: spacing['12'], // 32px
  },
} as const

/**
 * Component-specific spacing presets
 * Common spacing patterns for specific component types
 */
export const componentSpacing = {
  /** Card component spacing */
  card: {
    padding: spacing['4'], // 16px
    gap: spacing['4'], // 16px
    margin: spacing['6'], // 20px
  },

  /** Form component spacing */
  form: {
    fieldGap: spacing['4'], // 16px
    sectionGap: spacing['6'], // 20px
    labelGap: spacing['2'], // 8px
    inputPadding: spacing['3'], // 12px
  },

  /** Table component spacing */
  table: {
    cellPadding: spacing['3'], // 12px
    rowGap: spacing['2'], // 8px
    headerPadding: spacing['4'], // 16px
  },

  /** Button component spacing */
  button: {
    paddingX: spacing['4'], // 16px
    paddingY: spacing['2'], // 8px
    gap: spacing['2'], // 8px
  },

  /** Layout spacing */
  layout: {
    pagePadding: spacing['4'], // 16px
    sectionGap: spacing['6'], // 20px
    containerGap: spacing['8'], // 24px
  },
} as const

/**
 * Spacing key type for TypeScript support
 */
export type SpacingKey = keyof typeof spacing

/**
 * Spacing role type
 */
export type SpacingRole = keyof typeof spacingRoles

/**
 * Spacing size type
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg'

/**
 * Component spacing type
 */
export type ComponentSpacingKey = keyof typeof componentSpacing

/**
 * Spacing configuration interface
 */
export interface SpacingConfig {
  spacing: typeof spacing
  spacingRoles: typeof spacingRoles
  componentSpacing: typeof componentSpacing
}

/**
 * Complete spacing configuration object
 */
export const spacingConfig: SpacingConfig = {
  spacing,
  spacingRoles,
  componentSpacing,
} as const

/**
 * Helper function to get spacing value
 * @param key - Spacing key (e.g., '4', '8', '12')
 * @returns Spacing value in rem units
 */
export function getSpacing(key: SpacingKey): string {
  return spacing[key]
}

/**
 * Helper function to get semantic spacing value
 * @param role - Spacing role (compact, normal, relaxed)
 * @param size - Spacing size (xs, sm, md, lg)
 * @returns Spacing value in rem units
 */
export function getSpacingRole(role: SpacingRole, size: SpacingSize): string {
  return spacingRoles[role][size]
}

/**
 * Helper function to get component-specific spacing
 * @param component - Component name (card, form, table, button, layout)
 * @param property - Spacing property (padding, gap, margin, etc.)
 * @returns Spacing value in rem units
 */
export function getComponentSpacing(
  component: ComponentSpacingKey,
  property: keyof (typeof componentSpacing)[ComponentSpacingKey],
): string {
  return componentSpacing[component][property] as string
}

/**
 * Export default configuration
 */
export default spacingConfig
