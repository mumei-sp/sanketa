import { text } from '@/theme/colors'
import type { EventCategory, CategoryConfig } from '../types'

/**
 * Borders use `color-mix(in srgb, <token> 70%, black)` so they stay a shade
 * darker than the fill as the user switches presets — swapping a frozen
 * `darken(baseColors.X, 25)` hex that would otherwise remain pink in Ocean.
 */
const primaryBorder = 'color-mix(in srgb, var(--primary) 70%, black)'
const accentBorder = 'color-mix(in srgb, var(--accent) 70%, black)'

export const categoryConfig: Record<EventCategory, CategoryConfig> = {
  Academic: {
    label: 'Academic',
    backgroundColor: 'var(--primary)',
    borderColor: primaryBorder,
    textColor: text.body,
    iconName: 'GraduationCap',
  },
  Events: {
    label: 'Events',
    backgroundColor: 'var(--accent)',
    borderColor: accentBorder,
    textColor: text.body,
    iconName: 'PartyPopper',
  },
  Finance: {
    label: 'Finance',
    backgroundColor: 'var(--accent)',
    borderColor: accentBorder,
    textColor: text.body,
    iconName: 'DollarSign',
  },
  Administration: {
    label: 'Administration',
    backgroundColor: 'var(--primary)',
    borderColor: primaryBorder,
    textColor: text.body,
    iconName: 'Shield',
  },
}

export const allCategories: EventCategory[] = [
  'Academic',
  'Events',
  'Finance',
  'Administration',
]
