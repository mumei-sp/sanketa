/**
 * Centralized Typography Configuration
 *
 * This file provides a single source of truth for typography across the application.
 * All font families, weights, sizes, line heights, and semantic text roles are
 * defined here and exported for use in Tailwind CSS configuration and components.
 */

/**
 * Font weight semantic names
 */
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold'

/**
 * Font size semantic names
 */
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

/**
 * Semantic text role names
 */
export type TextRole =
  | 'pageTitle'
  | 'sectionTitle'
  | 'tableHeader'
  | 'body'
  | 'bodyMuted'
  | 'badge'
  | 'caption'
  | 'numeric'

/**
 * Font weight configuration
 * Maps semantic names to numeric font weight values
 */
export const fontWeights: Record<FontWeight, number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

/**
 * Font size configuration
 * Maps semantic names to rem values
 * All sizes are relative to 14px base font size
 */
export const fontSizes: Record<FontSize, string> = {
  xs: '0.857rem', // 12px (12/14)
  sm: '0.929rem', // 13px (13/14) - for tableHeader/bodyMuted
  base: '0.875rem', // 14px (14/14) - NEW BASE
  lg: '1.143rem', // 16px (16/14)
  xl: '1.429rem', // 20px (20/14)
  '2xl': '1.714rem', // 24px (24/14)
  '3xl': '2.143rem', // 30px (30/14)
  '4xl': '2.571rem', // 36px (36/14)
} as const

/**
 * Line height configuration
 * Maps semantic font size names to corresponding line heights
 * All line heights are relative to 14px base font size
 * Compact dashboard ratios for improved density
 */
export const lineHeights: Record<FontSize, string> = {
  xs: '1.029rem', // 12px * 1.2 = 14.4px (badge ratio)
  sm: '1.207rem', // 13px * 1.3 = 16.9px (tableHeader/caption ratio)
  base: '1.45rem', // 14px * 1.45 = 20.3px (body ratio)
  lg: '1.3rem', // 16px * 1.3 = 20.8px (numeric ratio)
  xl: '1.543rem', // 20px * 1.35 = 27px (sectionTitle ratio)
  '2xl': '1.857rem', // 24px * 1.3 = 31.2px (pageTitle ratio)
  '3xl': '2.143rem', // 30px * 1.2 = 36px
  '4xl': '2.571rem', // 36px * 1.11 = 40px
} as const

/**
 * Font family configuration
 * Primary font: Inter Variable with system fallbacks
 */
export const fontFamily = {
  sans: [
    'Inter Variable',
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ],
} as const

/**
 * Semantic text role configuration
 * Maps semantic roles to their typography properties (size, weight, line height)
 */
export interface TextRoleConfig {
  /** Font size semantic name */
  fontSize: FontSize
  /** Font weight semantic name */
  fontWeight: FontWeight
  /** Line height semantic name (usually matches fontSize) */
  lineHeight: FontSize
  /** Optional: font-variant-numeric for numeric content */
  fontVariantNumeric?: 'tabular-nums' | 'normal'
}

/**
 * Text role definitions
 * Each role specifies the appropriate font size, weight, and line height
 */
export const textRoles: Record<TextRole, TextRoleConfig> = {
  /**
   * pageTitle - Main page headers
   * Spec: 20px, weight 600, line-height 1.3
   * Usage: Primary page titles, hero headings
   * Example: <h1 className="text-page-title">Dashboard</h1>
   */
  pageTitle: {
    fontSize: 'xl', // 20px (1.429rem)
    fontWeight: 'semibold', // 600
    lineHeight: '2xl', // 1.3 ratio (1.857rem)
  },

  /**
   * sectionTitle - Card and section headers
   * Spec: 16px, weight 600, line-height 1.35
   * Usage: Section headings within cards, modal titles, drawer titles
   * Example: <h2 className="text-section-title">Student Information</h2>
   */
  sectionTitle: {
    fontSize: 'lg', // 16px (1.143rem)
    fontWeight: 'semibold', // 600
    lineHeight: 'xl', // 1.35 ratio (1.543rem)
  },

  /**
   * tableHeader - Table column headers
   * Spec: 13px, weight 500, line-height 1.3
   * Usage: Column headers in data tables
   * Example: <th className="text-table-header">Name</th>
   */
  tableHeader: {
    fontSize: 'sm', // 13px (0.929rem)
    fontWeight: 'medium', // 500
    lineHeight: 'sm', // 1.3 ratio (1.207rem)
  },

  /**
   * body - Default body text
   * Spec: 14px, weight 400, line-height 1.45
   * Usage: Paragraphs, default text content, form labels
   * Example: <p className="text-body">This is body text</p>
   */
  body: {
    fontSize: 'base', // 14px (0.875rem)
    fontWeight: 'regular', // 400
    lineHeight: 'base', // 1.45 ratio (1.45rem)
  },

  /**
   * bodyMuted - Secondary/muted text
   * Spec: 13px, weight 400, line-height 1.45
   * Usage: Helper text, descriptions, secondary information
   * Note: Typically combined with text-muted-foreground color class
   * Example: <p className="text-body-muted text-muted-foreground">Helper text</p>
   */
  bodyMuted: {
    fontSize: 'sm', // 13px (0.929rem)
    fontWeight: 'regular', // 400
    lineHeight: 'base', // 1.45 ratio (1.45rem) - using base for 1.45
  },

  /**
   * badge - Pills and status labels
   * Spec: 12px, weight 500, line-height 1.2
   * Usage: Badges, status indicators, tags
   * Example: <span className="text-badge">Active</span>
   */
  badge: {
    fontSize: 'xs', // 12px (0.857rem)
    fontWeight: 'medium', // 500
    lineHeight: 'xs', // 1.2 ratio (1.029rem)
  },

  /**
   * caption - Small helper text
   * Spec: 12px, weight 400, line-height 1.3
   * Usage: Captions, fine print, timestamps, metadata
   * Example: <span className="text-caption">Last updated 2 hours ago</span>
   */
  caption: {
    fontSize: 'xs', // 12px (0.857rem)
    fontWeight: 'regular', // 400
    lineHeight: 'sm', // 1.3 ratio (1.207rem)
  },

  /**
   * numeric - KPIs and metrics
   * Spec: 14px, weight 600, line-height 1.3
   * Usage: Numbers, statistics, financial data, counts
   * Note: Uses tabular-nums for consistent number width
   * Example: <span className="text-numeric">1,234</span>
   */
  numeric: {
    fontSize: 'base', // 14px (0.875rem)
    fontWeight: 'semibold', // 600
    lineHeight: 'lg', // 1.3 ratio (1.3rem)
    fontVariantNumeric: 'tabular-nums',
  },
} as const

/**
 * Complete typography configuration interface
 */
export interface TypographyConfig {
  fontFamily: typeof fontFamily
  fontWeights: typeof fontWeights
  fontSizes: typeof fontSizes
  lineHeights: typeof lineHeights
  textRoles: typeof textRoles
}

/**
 * Complete typography configuration object
 */
export const typographyConfig: TypographyConfig = {
  fontFamily,
  fontWeights,
  fontSizes,
  lineHeights,
  textRoles,
} as const

/**
 * Helper function to get font weight value by semantic name
 */
export function getFontWeight(weight: FontWeight): number {
  return fontWeights[weight]
}

/**
 * Helper function to get font size value by semantic name
 */
export function getFontSize(size: FontSize): string {
  return fontSizes[size]
}

/**
 * Helper function to get line height value by semantic name
 */
export function getLineHeight(size: FontSize): string {
  return lineHeights[size]
}

/**
 * Helper function to get text role configuration
 */
export function getTextRole(role: TextRole): TextRoleConfig {
  return textRoles[role]
}

/**
 * Export default configuration
 */
export default typographyConfig
