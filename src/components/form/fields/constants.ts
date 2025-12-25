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
 * Grid layout template column constants
 */
export const GRID_COLS_2 = '1fr 1fr'
export const GRID_COLS_3 = '1fr 2fr 2fr'

/**
 * Guardian input background class name
 */
export const GUARDIAN_INPUT_BG_CLASS = '[&_input]:bg-white'
export const GUARDIAN_BUTTON_BG_CLASS = '[&_button]:bg-white'
