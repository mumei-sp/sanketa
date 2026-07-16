/**
 * Appearance Configuration — Theme tokens exposed to the user via Settings → Appearance.
 *
 * A fresh install with no saved appearance MUST look byte-identical to today's
 * light mode (pink / cyan / navy). That pixel-identity is guaranteed by
 * DEFAULT_APPEARANCE below, which hard-codes the exact HEX values already
 * declared in `:root` of src/index.css.
 *
 * @see src/theme/apply-appearance.ts — runtime mapper that writes CSS vars
 */

import { baseColors } from './colors'

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'
export type Density = 'comfortable' | 'compact'

/**
 * User-facing appearance settings. Persisted as part of SchoolConfig.
 *
 * `appearanceVersion` is bumped when the shape changes incompatibly so we can
 * migrate old stored values safely; today we only run v1.
 */
export interface AppearanceConfig {
  appearanceVersion: 1
  mode: ThemeMode
  /** Active preset id. `custom` means the user dragged off a preset. */
  presetId: PresetId | 'custom'
  /** Brand primary — typically a soft accent (default pink). */
  primary: string
  /** Secondary accent — paired with primary for highlight surfaces. */
  accent: string
  /** Text anchor / heading color. */
  heading: string
  /** When true, moving primary auto-shifts accent to stay cohesive. */
  accentAutoDerive: boolean
  /** Reserved for Phase 2 — derive heading from contrast with background. */
  headingAutoDerive: boolean
  density: Density
  /** Corner radius in rem. */
  radius: number
  /** Reserved for Phase 2 advanced controls. */
  advanced?: {
    foregroundOverride?: string
    mutedOverride?: string
  }
}

// ============================================================================
// Presets
// ============================================================================

export type PresetId =
  | 'sanketa-classic'
  | 'pacific'
  | 'wisteria'
  | 'meadow'
  | 'champagne'

export interface AppearancePreset {
  id: PresetId
  label: string
  description: string
  primary: string
  accent: string
  heading: string
}

/**
 * Curated preset gallery — every entry follows the Schola formula:
 * two soft pastel surfaces anchored by one deep ink. Presets that broke the
 * formula (washed greys, low-contrast blush) were retired.
 *
 * `sanketa-classic` MUST reproduce today's light mode exactly.
 * Values come from `baseColors` in src/theme/colors.ts — the single source
 * of truth for the current brand palette.
 */
export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: 'sanketa-classic',
    label: 'Sanketa Classic',
    description: 'Signature pink & cyan over deep navy.',
    primary: baseColors.pink,     // #FECCFD
    accent: baseColors.blue,      // #CDEAF0
    heading: baseColors.heading,  // #15446E
  },
  {
    id: 'pacific',
    label: 'Pacific',
    description: 'Airy sky blue & sea mint with marine ink.',
    primary: '#BCE0F5',
    accent: '#CFF2EC',
    heading: '#0F3854',
  },
  {
    id: 'wisteria',
    label: 'Wisteria',
    description: 'Lilac & periwinkle with indigo ink.',
    primary: '#DDD5FB',
    accent: '#E4EAFE',
    heading: '#35306B',
  },
  {
    id: 'meadow',
    label: 'Meadow',
    description: 'Sage & mint with forest ink.',
    primary: '#C9EBD4',
    accent: '#E2F4E4',
    heading: '#1E4D38',
  },
  {
    id: 'champagne',
    label: 'Champagne',
    description: 'Warm champagne & cream with espresso ink.',
    primary: '#F6E0C3',
    accent: '#FAEEDB',
    heading: '#5A3E1E',
  },
]

export function getPreset(id: string): AppearancePreset | undefined {
  return APPEARANCE_PRESETS.find(p => p.id === id)
}

// ============================================================================
// Radius scale
// ============================================================================

export const RADIUS_OPTIONS = [
  { value: 0.625, label: 'Crisp' },
  { value: 1, label: 'Signature' },
  { value: 1.25, label: 'Round' },
] as const

// ============================================================================
// Defaults — MUST match `:root` values in src/index.css
// ============================================================================

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  appearanceVersion: 1,
  mode: 'light',
  presetId: 'sanketa-classic',
  primary: baseColors.pink,     // #FECCFD
  accent: baseColors.blue,      // #CDEAF0
  heading: baseColors.heading,  // #15446E
  accentAutoDerive: true,
  headingAutoDerive: false,
  density: 'comfortable',
  radius: 1,
}
