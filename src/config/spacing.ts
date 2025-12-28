/**
 * Compact Spacing Configuration
 *
 * This file provides a uniform, compact spacing scale for dashboard-optimized density.
 * Spacing values are reduced by approximately one Tailwind step to improve
 * information density while maintaining visual clarity.
 *
 * All values are in rem units, relative to 14px base font size.
 *
 * This is the SINGLE SOURCE OF TRUTH for all spacing values in the application.
 * All spacing (Tailwind classes, inline styles, CSS variables) should reference this config.
 *
 * Formula: Original Tailwind value * 0.875 (14px/16px base ratio) * 0.9-0.95 (compact reduction)
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
  '0.5': '0.125rem', // 2px (was 0.125rem)
  '1': '0.25rem', // 4px (was 0.25rem)

  // Small spacing (1.5-3)
  '1.5': '0.375rem', // 6px (was 0.375rem)
  '2': '0.5rem', // 8px (was 0.5rem)
  '2.5': '0.625rem', // 10px (was 0.625rem)
  '3': '0.75rem', // 12px (was 0.75rem)

  // Medium spacing (4-6)
  '4': '1rem', // 16px (was 1rem, now equivalent to p-4)
  '5': '1.125rem', // 18px (was 1.25rem)
  '6': '1.25rem', // 20px (was 1.5rem, now equivalent to p-5)

  // Extended medium spacing (7-11)
  '7': '1.375rem', // 22px (was 1.75rem)
  '9': '1.625rem', // 26px (was 2.25rem)
  '11': '1.875rem', // 30px (was 2.75rem)

  // Large spacing (8-14)
  '8': '1.5rem', // 24px (was 2rem, now equivalent to p-6)
  '10': '1.75rem', // 28px (was 2.5rem)
  '12': '2rem', // 32px (was 3rem, now equivalent to p-8)
  '14': '2.25rem', // 36px (was 3.5rem)

  // Extra large spacing (16-28)
  '16': '2.5rem', // 40px (was 4rem)
  '20': '3rem', // 48px (was 5rem)
  '24': '3.5rem', // 56px (was 6rem)
  '28': '4rem', // 64px (was 7rem)

  // Huge spacing (32-48)
  '32': '4.5rem', // 72px (was 8rem)
  '36': '5rem', // 80px (was 9rem)
  '40': '5.5rem', // 88px (was 10rem)
  '44': '6rem', // 96px (was 11rem)
  '48': '6.5rem', // 104px (was 12rem)

  // Extra huge spacing (52-64)
  '52': '7rem', // 112px (was 13rem)
  '56': '7.5rem', // 120px (was 14rem)
  '60': '8rem', // 128px (was 15rem)
  '64': '8.5rem', // 136px (was 16rem)

  // Maximum spacing (72-96)
  '72': '9.5rem', // 152px (was 18rem)
  '80': '10.5rem', // 168px (was 20rem)
  '96': '13rem', // 208px (was 24rem)
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
