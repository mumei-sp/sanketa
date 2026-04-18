/**
 * Live brand color accessor — reads the current `AppearanceConfig` so that
 * components re-render whenever the user switches preset / drags a handle.
 *
 * Chart series and any JSX that used to pull straight from `baseColors` must
 * call this hook instead, otherwise they stay stuck on whatever the palette
 * happened to be at module load time.
 *
 * Return keys intentionally mirror `baseColors` so callers can do a
 * mechanical find-and-replace:
 *
 *   const { pink, blue, heading } = useBrandColors()  // replaces `baseColors`
 */

import { useSchoolConfig } from '@/config/SchoolConfigContext'

export interface BrandColors {
  /** Aliased to `primary`. Kept for drop-in compatibility with `baseColors.pink`. */
  pink: string
  /** Aliased to `accent`. Kept for drop-in compatibility with `baseColors.blue`. */
  blue: string
  heading: string
  primary: string
  accent: string
}

export function useBrandColors(): BrandColors {
  const { config } = useSchoolConfig()
  const { primary, accent, heading } = config.appearance
  return { pink: primary, blue: accent, heading, primary, accent }
}
