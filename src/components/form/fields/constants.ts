import type React from 'react'
import { colors } from '@/theme/colors'

/**
 * Common country codes for phone number selection
 */
export const COUNTRY_CODES = [
  { value: '+1', label: '+1' },
  { value: '+44', label: '+44' },
  { value: '+91', label: '+91' },
  { value: '+86', label: '+86' },
  { value: '+81', label: '+81' },
  { value: '+49', label: '+49' },
  { value: '+33', label: '+33' },
  { value: '+61', label: '+61' },
] as const

/**
 * Phone field styling constants for guardian sections
 */
export const GUARDIAN_PHONE_FIELD_STYLE: React.CSSProperties = {
  backgroundColor: colors.accent.soft,
}
export const GUARDIAN_PHONE_FIELD_CLASSNAME = 'hover:bg-accent'

/**
 * Responsive form-row grids.
 *
 * These are class names rather than inline `gridTemplateColumns` values so the
 * breakpoints actually apply: a 20/40/40 split leaves roughly 60px per field on
 * a phone, which clips the label and the input alike. Every multi-column form
 * row therefore stacks below `sm` and takes its designed proportions above it.
 *
 * Apply with `cn('grid gap-4', FORM_GRID_3)`; a child that spans two of the
 * three tracks needs `FORM_GRID_3_SPAN_2` so it also stacks.
 */
export const FORM_GRID_2 = 'grid-cols-1 sm:grid-cols-2'
export const FORM_GRID_3 = 'grid-cols-1 sm:grid-cols-[1fr_2fr_2fr]'
export const FORM_GRID_3_SPAN_2 = 'sm:col-span-2'

/**
 * Guardian input background class name
 */
export const GUARDIAN_INPUT_BG_CLASS = '[&_input]:bg-white'
export const GUARDIAN_BUTTON_BG_CLASS = '[&_button]:bg-white'
