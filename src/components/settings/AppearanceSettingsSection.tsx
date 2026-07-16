/**
 * AppearanceSettingsSection — the body of Settings → Appearance.
 *
 * Owns a live-preview effect keyed on `draft.appearance`: every edit writes
 * directly to `document.documentElement` via `applyAppearance`, so tokens
 * cascade across the whole app in real time. On unmount (ESC / outside click /
 * route change / crash) it re-applies the saved `config.appearance`,
 * guaranteeing a clean revert without a separate Cancel handler.
 *
 * Layout: an aurora "theme studio" hero (mode scenes, arc palette, shuffle,
 * live preview mini-app), then numbered studio cards for the curated preset
 * gallery and interface tuning (density / radius).
 */

import * as React from 'react'
import { RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import type { SchoolConfig } from '@/config/school-config'
import {
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE,
  RADIUS_OPTIONS,
  getPreset,
  type AppearanceConfig,
  type Density,
  type ThemeMode,
} from '@/theme/appearance'
import { applyAppearance, deriveAccent, hslToHex } from '@/theme/apply-appearance'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { ArcColorPicker } from '@/components/ui/arc-color-picker'
import { text } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import {
  ModeSelector,
  PresetCard,
  LivePreviewPanel,
  OptionCard,
  DensityGlyph,
  RadiusGlyph,
} from './appearance-parts'

interface Props {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

// ============================================================================
// Section
// ============================================================================

export function AppearanceSettingsSection({ draft, setDraft }: Props) {
  const { config } = useSchoolConfig()

  // Live-preview the draft onto the document.
  // Cleanup re-applies the committed config, which handles ESC / unmount / cancel.
  React.useLayoutEffect(() => {
    applyAppearance(draft.appearance)
    return () => {
      applyAppearance(config.appearance)
    }
  }, [draft.appearance, config.appearance])

  const patch = React.useCallback(
    (update: Partial<AppearanceConfig>) => {
      setDraft(prev => ({
        ...prev,
        appearance: { ...prev.appearance, ...update },
      }))
    },
    [setDraft],
  )

  const handlePickerChange = React.useCallback(
    ({ primary, heading }: { primary?: string; heading?: string }) => {
      setDraft(prev => {
        const next: AppearanceConfig = {
          ...prev.appearance,
          presetId: 'custom',
          ...(primary ? { primary } : {}),
          ...(heading ? { heading } : {}),
        }
        if (primary && next.accentAutoDerive) {
          next.accent = deriveAccent(primary)
        }
        return { ...prev, appearance: next }
      })
    },
    [setDraft],
  )

  const handlePreset = React.useCallback(
    (presetId: string) => {
      const preset = getPreset(presetId)
      if (!preset) return
      patch({
        presetId: preset.id,
        primary: preset.primary,
        accent: preset.accent,
        heading: preset.heading,
        accentAutoDerive: true,
      })
    },
    [patch],
  )

  const handleReset = React.useCallback(() => {
    patch({ ...DEFAULT_APPEARANCE })
  }, [patch])

  const handleInvert = React.useCallback(() => {
    patch({ mode: draft.appearance.mode === 'dark' ? 'light' : 'dark' })
  }, [draft.appearance.mode, patch])

  /**
   * Shuffle — rolls a fresh pastel-plus-ink palette on the Schola formula:
   * a soft high-lightness primary, an ink rotated to the far side of the
   * wheel and held dark enough to stay AA/AAA on white, accent auto-derived.
   */
  const handleShuffle = React.useCallback(() => {
    const hue = Math.random() * 360
    const primary = hslToHex(hue, 0.7 + Math.random() * 0.18, 0.86 + Math.random() * 0.04)
    const inkHue = (hue + 150 + Math.random() * 80) % 360
    const heading = hslToHex(inkHue, 0.42 + Math.random() * 0.2, 0.22 + Math.random() * 0.06)
    patch({
      presetId: 'custom',
      primary,
      heading,
      accent: deriveAccent(primary),
      accentAutoDerive: true,
    })
  }, [patch])

  const isCustom = draft.appearance.presetId === 'custom'
  const { appearance } = draft

  return (
    <>
      <SectionHeading
        title="Appearance"
        description="Palette, mode, and personality — every change previews live across the app."
      />

      <div className="flex flex-col" style={{ gap: spacing['3'] }}>
        {/* ================= Theme studio hero ================= */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundColor: 'var(--card)',
            boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--card-border)',
          }}
        >
          {/* Slow-panning brand band */}
          <div aria-hidden className="appearance-gradient-band" />

          {/* Aurora washes — theme-reactive, purely decorative */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in srgb, var(--primary) 42%, transparent), transparent 72%)',
              filter: 'blur(28px)',
              transition: 'background 300ms ease',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in srgb, var(--accent) 46%, transparent), transparent 72%)',
              filter: 'blur(30px)',
              transition: 'background 300ms ease',
            }}
          />

          <div className="relative flex flex-col gap-4 p-5">
            {/* Header row: eyebrow + title | shuffle & reset */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--heading)', opacity: 0.65 }}
                >
                  <Sparkles size={11} strokeWidth={2.25} />
                  Theme studio
                </span>
                <h4
                  className="text-xl font-extrabold tracking-tight"
                  style={{ color: 'var(--heading)' }}
                >
                  Make Sanketa yours
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StudioButton onClick={handleShuffle} title="Roll a fresh palette">
                  <Shuffle size={12} strokeWidth={2.25} />
                  Shuffle
                </StudioButton>
                <StudioButton onClick={handleReset} title="Back to Sanketa Classic">
                  <RotateCcw size={12} strokeWidth={2.25} />
                  Reset
                </StudioButton>
              </div>
            </div>

            {/* Mode scenes */}
            <ModeSelector
              value={appearance.mode}
              onChange={v => patch({ mode: v as ThemeMode })}
              primary={appearance.primary}
              accent={appearance.accent}
              heading={appearance.heading}
            />

            {/* Palette | live preview — auto-stacks when the panel is narrow */}
            <div
              className="grid items-stretch"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: spacing['4'],
              }}
            >
              <div className="flex flex-col gap-2.5 min-w-0">
                <div style={{ alignSelf: 'center' }}>
                  <ArcColorPicker
                    primary={appearance.primary}
                    heading={appearance.heading}
                    onChange={handlePickerChange}
                    onInvert={handleInvert}
                    onReset={handleReset}
                  />
                </div>
                <HexReadout label="Primary" value={appearance.primary} />
                <HexReadout label="Accent" value={appearance.accent} />
                <HexReadout label="Heading" value={appearance.heading} showContrast />
                <p className="text-[11px] leading-relaxed" style={{ color: text.muted }}>
                  Light handle sets primary, dark handle sets the text anchor. Accent follows
                  automatically.
                </p>
              </div>

              <LivePreviewPanel />
            </div>
          </div>
        </div>

        {/* ================= Curated palette gallery ================= */}
        <StudioCard
          index={2}
          title="Curated palettes"
          aside={isCustom ? <CustomPaletteChip /> : null}
          hint="A hand-picked set — two soft surfaces anchored by one deep ink."
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: spacing['2'],
            }}
          >
            {APPEARANCE_PRESETS.map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                active={appearance.presetId === preset.id}
                onSelect={() => handlePreset(preset.id)}
              />
            ))}
          </div>
        </StudioCard>

        {/* ================= Interface tuning ================= */}
        <StudioCard index={3} title="Interface">
          <div className="grid" style={{ gridTemplateColumns: '2fr 3fr', gap: spacing['6'] }}>
            <FieldGroup label="Density">
              <div className="grid grid-cols-2" style={{ gap: spacing['2'] }}>
                {(
                  [
                    { value: 'comfortable', label: 'Comfortable', compact: false },
                    { value: 'compact', label: 'Compact', compact: true },
                  ] as const
                ).map(opt => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    active={appearance.density === opt.value}
                    onSelect={() => patch({ density: opt.value as Density })}
                  >
                    <DensityGlyph compact={opt.compact} />
                  </OptionCard>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Corner radius">
              <div className="grid grid-cols-3" style={{ gap: spacing['2'] }}>
                {RADIUS_OPTIONS.map(opt => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    active={appearance.radius === opt.value}
                    onSelect={() => patch({ radius: opt.value })}
                  >
                    <RadiusGlyph rem={opt.value} />
                  </OptionCard>
                ))}
              </div>
            </FieldGroup>
          </div>
        </StudioCard>
      </div>
    </>
  )
}

// ============================================================================
// Studio chrome — hero buttons and numbered section cards
// ============================================================================

function StudioButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-px"
      style={{
        color: 'var(--heading)',
        backgroundColor: 'color-mix(in srgb, var(--card) 65%, transparent)',
        boxShadow: 'inset 0 0 0 1px var(--border), 0 1px 3px rgb(21 68 110 / 0.06)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </button>
  )
}

function StudioCard({
  index,
  title,
  hint,
  aside,
  children,
}: {
  index: number
  title: string
  hint?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      className="flex flex-col rounded-2xl p-4"
      style={{
        gap: spacing['3'],
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--card-border)',
      }}
    >
      <header className="flex items-center" style={{ gap: spacing['2'] }}>
        <span
          className="font-mono text-[10px] font-bold tabular-nums"
          style={{ color: 'var(--muted-foreground)', opacity: 0.8 }}
        >
          {String(index).padStart(2, '0')}
        </span>
        <h4 className="text-sm font-bold" style={{ color: 'var(--heading)' }}>
          {title}
        </h4>
        <span
          aria-hidden
          className="flex-1 h-px"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        />
        {aside}
      </header>
      {children}
      {hint && (
        <p className="text-[11px]" style={{ color: text.muted, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
    </section>
  )
}

// ============================================================================
// Custom-palette indicator — shows in the gallery header when the user has
// drifted the picker (or shuffle) off any named preset.
// ============================================================================

function CustomPaletteChip() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{
        padding: '2px 8px',
        backgroundColor: 'color-mix(in srgb, var(--primary) 30%, var(--card))',
        color: 'var(--heading)',
      }}
      title="You've drifted from a preset. Saving keeps this custom palette."
    >
      <Sparkles size={10} strokeWidth={2} />
      Custom palette
    </span>
  )
}

// ============================================================================
// HEX readout chip — live color swatch + monospaced hex label + optional WCAG
// contrast badge for the heading color (vs. white card background).
// ============================================================================

function HexReadout({
  label,
  value,
  showContrast = false,
}: {
  label: string
  value: string
  showContrast?: boolean
}) {
  return (
    <div
      className="flex items-center rounded-lg"
      style={{
        padding: `${spacing['2']} ${spacing['2.5']}`,
        boxShadow: 'inset 0 0 0 1px var(--border)',
        backgroundColor: 'color-mix(in srgb, var(--card) 80%, transparent)',
        gap: spacing['2.5'],
      }}
    >
      <div
        className="rounded-md shrink-0"
        style={{
          width: '22px',
          height: '22px',
          backgroundColor: value,
          boxShadow: 'inset 0 0 0 1px var(--border)',
          transition: 'background-color 200ms ease',
        }}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-[10px] font-medium uppercase tracking-wide"
          style={{ color: text.muted, lineHeight: 1 }}
        >
          {label}
        </span>
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: 'var(--heading)', lineHeight: 1.3, marginTop: '2px' }}
        >
          {value.toUpperCase()}
        </span>
      </div>
      {showContrast && <LegibilityDemo color={value} />}
      {showContrast && <ContrastBadge fg={value} />}
    </div>
  )
}

// ============================================================================
// Legibility demo — tiny "Aa Aa Aa" sample in the heading color at 3 sizes, so
// the AAA contrast claim is visually self-evident on the chip itself.
// ============================================================================

function LegibilityDemo({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="shrink-0 inline-flex items-baseline"
      style={{
        gap: '6px',
        color,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1,
      }}
      title="Heading color rendered at 12 / 14 / 16 px"
    >
      <span style={{ fontSize: '12px', fontWeight: 400 }}>Aa</span>
      <span style={{ fontSize: '14px', fontWeight: 600 }}>Aa</span>
      <span style={{ fontSize: '16px', fontWeight: 700 }}>Aa</span>
    </span>
  )
}

// ============================================================================
// Contrast badge — WCAG 2.1 score of fg against a white card background.
// Pill color mirrors the standard vivid status palette.
// ============================================================================

function ContrastBadge({ fg, bg = '#FFFFFF' }: { fg: string; bg?: string }) {
  const ratio = contrastRatio(fg, bg)
  const tier = ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail'
  const palette = {
    aaa:  { bg: '#F0FDF4', color: '#166534', label: 'AAA' },
    aa:   { bg: '#FFFBEB', color: '#92400E', label: 'AA' },
    fail: { bg: '#FEF2F2', color: '#991B1B', label: 'Low' },
  }[tier]
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide rounded-full shrink-0"
      style={{
        padding: '2px 6px',
        backgroundColor: palette.bg,
        color: palette.color,
      }}
      title={`Contrast ${ratio.toFixed(2)}:1 on white`}
    >
      {palette.label}
    </span>
  )
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

// ============================================================================
// Shared field atoms
// ============================================================================

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: spacing['2'] }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--heading)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: text.muted, lineHeight: 1.5, marginTop: spacing['1'] }}>
        {description}
      </p>
    </div>
  )
}

function FieldGroup({
  label,
  hint,
  headerRight,
  children,
}: {
  label: string
  hint?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      <div className="flex items-center justify-between" style={{ gap: spacing['2'] }}>
        <label
          className="text-sm font-semibold"
          style={{ color: 'var(--heading)' }}
        >
          {label}
        </label>
        {headerRight}
      </div>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: text.muted, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
