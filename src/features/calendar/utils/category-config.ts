import { baseColors, text, accent, darken } from '@/theme/colors'
import type { EventCategory, CategoryConfig } from '../types'

export const categoryConfig: Record<EventCategory, CategoryConfig> = {
  Academic: {
    label: 'Academic',
    backgroundColor: baseColors.pink,
    borderColor: darken(baseColors.pink, 25),
    textColor: text.body,
    iconName: 'GraduationCap',
  },
  Events: {
    label: 'Events',
    backgroundColor: baseColors.blue,
    borderColor: darken(baseColors.blue, 25),
    textColor: text.body,
    iconName: 'PartyPopper',
  },
  Finance: {
    label: 'Finance',
    backgroundColor: accent.soft,
    borderColor: darken(accent.soft, 25),
    textColor: text.body,
    iconName: 'DollarSign',
  },
  Administration: {
    label: 'Administration',
    backgroundColor: baseColors.pink,
    borderColor: darken(baseColors.pink, 25),
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
