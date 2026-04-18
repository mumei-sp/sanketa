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
  | 'soft-pink'
  | 'ocean'
  | 'emerald'
  | 'mono'

export interface AppearancePreset {
  id: PresetId
  label: string
  description: string
  primary: string
  accent: string
  heading: string
}

/**
 * `sanketa-classic` MUST reproduce today's light mode exactly.
 * Values come from `baseColors` in src/theme/colors.ts — the single source
 * of truth for the current brand palette.
 */
export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: 'sanketa-classic',
    label: 'Sanketa Classic',
    description: 'The default pink + navy brand look.',
    primary: baseColors.pink,     // #FECCFD
    accent: baseColors.blue,      // #CDEAF0
    heading: baseColors.heading,  // #15446E
  },
  {
    id: 'soft-pink',
    label: 'Soft Pink',
    description: 'Warmer blush with mocha ink.',
    primary: '#FBD5E2',
    accent: '#F5E6D8',
    heading: '#4A2C3A',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Calm blues with deep slate text.',
    primary: '#BCE0F5',
    accent: '#D6ECF2',
    heading: '#0F3854',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    description: 'Fresh greens with forest text.',
    primary: '#C8EBD3',
    accent: '#E3F2E0',
    heading: '#1F4D3A',
  },
  {
    id: 'mono',
    label: 'Mono',
    description: 'Neutral greys for a quiet UI.',
    primary: '#E5E5E5',
    accent: '#F0F0F0',
    heading: '#1F1F1F',
  },
]

export function getPreset(id: string): AppearancePreset | undefined {
  return APPEARANCE_PRESETS.find(p => p.id === id)
}

// ============================================================================
// Radius scale
// ============================================================================

export const RADIUS_OPTIONS = [
  { value: 0.4, label: 'Sharp' },
  { value: 0.625, label: 'Default' },
  { value: 0.9, label: 'Soft' },
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
  radius: 0.625,
}
