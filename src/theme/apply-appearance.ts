/**
 * Runtime theme mapper — translates an AppearanceConfig into CSS variable
 * writes on a target element (default: document.documentElement).
 *
 * This is the single hop between persisted user preferences and on-screen
 * rendering. Every brand token in src/index.css `:root` that a user can
 * influence is rewritten here.
 *
 * @see src/theme/appearance.ts — schema and defaults
 */

import type { AppearanceConfig } from './appearance'

// ============================================================================
// Color math — small, dep-free HEX <-> HSL utilities
// ============================================================================

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

/** Relative luminance per WCAG 2.1 (linearized sRGB). */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Returns `#111111` for light backgrounds and `#ffffff` for dark ones. */
export function pickForegroundFor(hex: string): string {
  return luminance(hex) > 0.55 ? '#15446e' : '#ffffff'
}

/** HEX -> HSL tuple in [0-360, 0-1, 0-1]. */
function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
    case g: h = ((b - r) / d + 2); break
    case b: h = ((r - g) / d + 4); break
  }
  return [h * 60, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  s = clamp01(s)
  l = clamp01(l)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60)      [r, g, b] = [c, x, 0]
  else if (h < 120)[r, g, b] = [x, c, 0]
  else if (h < 180)[r, g, b] = [0, c, x]
  else if (h < 240)[r, g, b] = [0, x, c]
  else if (h < 300)[r, g, b] = [x, 0, c]
  else             [r, g, b] = [c, 0, x]
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Derive accent from primary by rotating hue +28° and holding saturation/lightness
 * near the source. Kept purposely gentle so auto-derive never produces a garish
 * companion color.
 */
export function deriveAccent(primaryHex: string): string {
  const [h, s, l] = hexToHsl(primaryHex)
  const rotated = (h + 28) % 360
  return hslToHex(rotated, Math.min(s, 0.5), Math.min(Math.max(l, 0.82), 0.94))
}

// ============================================================================
// Dark mode resolution
// ============================================================================

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveDarkMode(mode: AppearanceConfig['mode']): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return prefersDark()
}

// ============================================================================
// Main mapper
// ============================================================================

/**
 * Write every appearance-driven CSS variable onto `target`.
 * Cheap (O(~20 property writes)) and safe to call on every draft tick.
 */
export function applyAppearance(
  appearance: AppearanceConfig,
  target: HTMLElement = document.documentElement,
): void {
  const { primary, accent, heading, density, radius, mode } = appearance

  const primaryFg = pickForegroundFor(primary)
  const accentFg = pickForegroundFor(accent)

  const set = (name: string, value: string) => target.style.setProperty(name, value)
  const clear = (name: string) => target.style.removeProperty(name)

  // Resolve dark mode FIRST — the foreground writes below branch on it so the
  // user's (dark) heading color doesn't get painted over dark surfaces.
  const isDark = resolveDarkMode(mode)

  // Radius
  set('--radius', `${radius}rem`)

  // Brand tokens
  set('--primary', primary)
  set('--primary-foreground', primaryFg)
  set('--accent', accent)
  set('--accent-foreground', accentFg)

  // Chart palette — respect the existing 3-color limit (chart 1/2/3 are brand)
  set('--chart-1', primary)
  set('--chart-2', accent)
  set('--chart-3', heading)

  // Foreground family
  //  - Light mode: anchor every text surface to the user's picked heading color.
  //  - Dark mode:  clear the inline overrides so the `.dark` CSS rule in
  //                index.css (near-white foregrounds) wins and text remains
  //                legible on dark backgrounds. `--heading-accent` keeps the
  //                user's chosen color around for accent surfaces that want it.
  if (isDark) {
    clear('--heading')
    clear('--foreground')
    clear('--card-foreground')
    clear('--popover-foreground')
    clear('--secondary-foreground')
    clear('--sidebar-foreground')
    set('--heading-accent', heading)
    // Rings still track accent so focus states stay on-brand
    set('--ring', accent)
    set('--sidebar-primary', primary)
    set('--sidebar-accent', primary)
    set('--sidebar-ring', accent)
    // Active-nav sits on primary pink → auto-contrast foreground keeps the
    // label legible regardless of the user's picked palette.
    set('--sidebar-primary-foreground', primaryFg)
    set('--sidebar-accent-foreground', primaryFg)
  } else {
    set('--heading', heading)
    set('--foreground', heading)
    set('--card-foreground', heading)
    set('--popover-foreground', heading)
    set('--secondary-foreground', heading)
    set('--sidebar-foreground', heading)
    set('--ring', accent)
    set('--sidebar-primary', primary)
    set('--sidebar-primary-foreground', heading)
    set('--sidebar-accent', primary)
    set('--sidebar-accent-foreground', heading)
    set('--sidebar-ring', accent)
    set('--heading-accent', heading)
  }

  // Density attribute — consumed by CSS rules in index.css
  target.setAttribute('data-density', density)

  // Dark mode class toggle
  target.classList.toggle('dark', isDark)
}

// ============================================================================
// System-mode media-query subscription
// ============================================================================

let systemModeCleanup: (() => void) | null = null

/**
 * Subscribe to OS color-scheme changes so that `mode: 'system'` re-applies
 * live. Returns a cleanup fn; safe to call repeatedly (idempotent).
 */
export function subscribeToSystemMode(
  getAppearance: () => AppearanceConfig,
  target: HTMLElement = document.documentElement,
): () => void {
  systemModeCleanup?.()
  if (typeof window === 'undefined' || !window.matchMedia) {
    systemModeCleanup = null
    return () => {}
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => {
    const current = getAppearance()
    if (current.mode === 'system') applyAppearance(current, target)
  }
  mql.addEventListener('change', listener)
  systemModeCleanup = () => mql.removeEventListener('change', listener)
  return systemModeCleanup
}
