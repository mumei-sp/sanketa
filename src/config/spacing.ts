/**
 * Compact Spacing Configuration
 *
 * This file provides a compact spacing scale for dashboard-optimized density.
 * Spacing values are reduced by approximately one Tailwind step to improve
 * information density while maintaining visual clarity.
 *
 * All values are in rem units, relative to 14px base font size.
 */

/**
 * Compact spacing scale
 * Maps Tailwind spacing tokens to reduced values (down by ~1 step)
 *
 * Conversion: Original Tailwind value * 0.875 (14px/16px base ratio)
 * Then further reduced by ~10-15% for compact density
 */
export const spacing = {
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

  // Large spacing (8-12)
  '8': '1.5rem', // 24px (was 2rem, now equivalent to p-6)
  '10': '1.75rem', // 28px (was 2.5rem)
  '12': '2rem', // 32px (was 3rem, now equivalent to p-8)

  // Extra large spacing (16-24)
  '16': '2.5rem', // 40px (was 4rem)
  '20': '3rem', // 48px (was 5rem)
  '24': '3.5rem', // 56px (was 6rem)

  // Huge spacing (32+)
  '32': '4.5rem', // 72px (was 8rem)
  '40': '5.5rem', // 88px (was 10rem)
  '48': '6.5rem', // 104px (was 12rem)
  '64': '8.5rem', // 136px (was 16rem)
} as const

/**
 * Semantic spacing roles for common use cases
 */
export const spacingRoles = {
  /** Compact spacing for tight layouts (tables, dense lists) */
  compact: {
    xs: spacing['1'], // 4px
    sm: spacing['2'], // 8px
    md: spacing['3'], // 12px
    lg: spacing['4'], // 16px
  },

  /** Normal spacing for standard layouts (cards, forms) */
  normal: {
    xs: spacing['2'], // 8px
    sm: spacing['3'], // 12px
    md: spacing['4'], // 16px
    lg: spacing['6'], // 20px
  },

  /** Relaxed spacing for spacious layouts (landing pages, hero sections) */
  relaxed: {
    xs: spacing['4'], // 16px
    sm: spacing['6'], // 20px
    md: spacing['8'], // 24px
    lg: spacing['12'], // 32px
  },
} as const

/**
 * Spacing configuration interface
 */
export interface SpacingConfig {
  spacing: typeof spacing
  spacingRoles: typeof spacingRoles
}

/**
 * Complete spacing configuration object
 */
export const spacingConfig: SpacingConfig = {
  spacing,
  spacingRoles,
} as const

/**
 * Helper function to get spacing value
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key]
}

/**
 * Helper function to get semantic spacing value
 */
export function getSpacingRole(
  role: keyof typeof spacingRoles,
  size: 'xs' | 'sm' | 'md' | 'lg',
): string {
  return spacingRoles[role][size]
}

/**
 * Export default configuration
 */
export default spacingConfig
