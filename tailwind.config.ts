import type { Config } from 'tailwindcss'
import { tailwindColors, colors } from './src/theme/colors'
import {
  fontFamily,
  fontSizes,
  fontWeights,
  lineHeights,
} from './src/config/typography'
import { spacing } from './src/config/spacing'

/**
 * Tailwind CSS Configuration
 *
 * Extends Tailwind v4 with semantic color tokens from the centralized theme system.
 * Colors are available as utilities: bg-primary-soft, text-heading, bg-status-success, etc.
 * Typography values are sourced from the centralized typography config.
 * Spacing values are sourced from the centralized spacing config for uniform spacing across the app.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: fontFamily.sans,
        mono: fontFamily.mono,
      },
      fontSize: fontSizes,
      fontWeight: fontWeights,
      lineHeight: lineHeights,
      spacing: spacing,
      colors: {
        // Primary colors (pink-based)
        primary: {
          DEFAULT: colors.primary.base,
          soft: colors.primary.soft,
          muted: colors.primary.muted,
          subtle: colors.primary.subtle,
          hover: colors.primary.hover,
          active: colors.primary.active,
        },
        // Accent colors (blue-based)
        accent: {
          DEFAULT: colors.accent.base,
          soft: colors.accent.soft,
          muted: colors.accent.muted,
          subtle: colors.accent.subtle,
          hover: colors.accent.hover,
          active: colors.accent.active,
        },
        // Text colors
        heading: colors.text.heading,
        'text-body': colors.text.body,
        'text-muted': colors.text.muted,
        // Map to standard text utilities
        text: {
          heading: colors.text.heading,
          body: colors.text.body,
          muted: colors.text.muted,
        },
        // Background colors
        'bg-page': colors.background.page,
        'bg-card': colors.background.card,
        'bg-surface': colors.background.surface,
        'bg-highlight': colors.background.highlight,
        'bg-sidebar': colors.background.sidebar,
        'bg-sidebar-active': colors.background['sidebar-active'],
        'bg-table-header': colors.background['table-header'],
        // Map to standard background utilities
        background: {
          page: colors.background.page,
          card: colors.background.card,
          surface: colors.background.surface,
          highlight: colors.background.highlight,
          sidebar: colors.background.sidebar,
          'sidebar-active': colors.background['sidebar-active'],
          'table-header': colors.background['table-header'],
        },
        // Border colors
        'border-default': colors.border.default,
        'border-subtle': colors.border.subtle,
        'border-muted': colors.border.muted,
        // Map to standard border utilities
        border: {
          DEFAULT: colors.border.default,
          subtle: colors.border.subtle,
          muted: colors.border.muted,
        },
        // Status colors
        status: {
          success: {
            DEFAULT: colors.status.success.base,
            soft: colors.status.success.soft,
            muted: colors.status.success.muted,
            text: colors.status.success.text,
            dot: colors.status.success.dot,
          },
          info: {
            DEFAULT: colors.status.info.base,
            soft: colors.status.info.soft,
            muted: colors.status.info.muted,
            text: colors.status.info.text,
            dot: colors.status.info.dot,
          },
          warning: {
            DEFAULT: colors.status.warning.base,
            soft: colors.status.warning.soft,
            muted: colors.status.warning.muted,
            text: colors.status.warning.text,
            dot: colors.status.warning.dot,
          },
          danger: {
            DEFAULT: colors.status.danger.base,
            soft: colors.status.danger.soft,
            muted: colors.status.danger.muted,
            text: colors.status.danger.text,
            dot: colors.status.danger.dot,
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
