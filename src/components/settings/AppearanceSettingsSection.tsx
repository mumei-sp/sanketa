/**
 * AppearanceSettingsSection — the body of Settings → Appearance.
 *
 * Owns a live-preview effect keyed on `draft.appearance`: every edit writes
 * directly to `document.documentElement` via `applyAppearance`, so tokens
 * cascade across the whole app in real time. On unmount (ESC / outside click /
 * route change / crash) it re-applies the saved `config.appearance`,
 * guaranteeing a clean revert without a separate Cancel handler.
 */

import * as React from 'react'
import { RotateCcw, Rows3, AlignJustify, Sparkles } from 'lucide-react'
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
import { applyAppearance, deriveAccent } from '@/theme/apply-appearance'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { ArcColorPicker } from '@/components/ui/arc-color-picker'
import { Button } from '@/components/ui/button'
import { Tile } from '@/components/tile'
import { text, border, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { ThemeModeToggle, PresetCard, LivePreviewPanel } from './appearance-parts'

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

  const isCustom = draft.appearance.presetId === 'custom'

  return (
    <>
      <SectionHeading
        title="Appearance"
        description="Theme, brand colors, density, and radius."
      />

      <div
        className="flex flex-col"
        style={{ gap: spacing['3'] }}
      >
        {/* ========== Combined tile — Brand colors (left) | Theme mode + Preview (right) ========== */}
        <Tile
          id="appearance-palette"
          layoutMode="block"
          background="card"
          borderRadius="lg"
          padding="p-4"
          className="border"
          style={{ borderColor: border.default }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 1fr)',
              gap: spacing['4'],
              alignItems: 'stretch',
            }}
          >
            {/* LEFT — Brand colors */}
            <div style={{ minWidth: 0 }}>
              <FieldGroup
                label="Brand colors"
                hint="Drag the light handle for primary, dark handle for text anchor."
              >
                <div
                  className="flex flex-col"
                  style={{ gap: spacing['3'], alignItems: 'stretch' }}
                >
                  <div style={{ alignSelf: 'center' }}>
                    <ArcColorPicker
                      primary={draft.appearance.primary}
                      heading={draft.appearance.heading}
                      onChange={handlePickerChange}
                      onInvert={handleInvert}
                      onReset={handleReset}
                    />
                  </div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: '1fr 1fr',
                      gap: spacing['2'],
                    }}
                  >
                    <HexReadout label="Primary" value={draft.appearance.primary} />
                    <HexReadout label="Accent" value={draft.appearance.accent} />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <HexReadout
                        label="Heading"
                        value={draft.appearance.heading}
                        showContrast
                      />
                    </div>
                  </div>
                </div>
              </FieldGroup>
            </div>

            {/* RIGHT — Theme mode + Live preview, separated by a subtle left seam */}
            <div
              className="flex flex-col"
              style={{
                minWidth: 0,
                gap: spacing['3'],
                borderLeft: `1px solid ${border.subtle}`,
                paddingLeft: spacing['4'],
              }}
            >
              <FieldGroup label="Theme mode">
                <ThemeModeToggle
                  value={draft.appearance.mode}
                  onChange={v => patch({ mode: v as ThemeMode })}
                />
              </FieldGroup>
              <LivePreviewPanel />
            </div>
          </div>
        </Tile>

        {/* ========== Density + Corner radius tile (2-col inside) ========== */}
        <Tile
          id="appearance-layout"
          layoutMode="block"
          background="card"
          borderRadius="lg"
          padding="p-4"
          className="border"
          style={{ borderColor: border.default }}
        >
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: spacing['6'] }}>
            <FieldGroup label="Density">
              <SegmentedControl
                value={draft.appearance.density}
                onChange={v => patch({ density: v as Density })}
                options={[
                  {
                    value: 'comfortable',
                    label: 'Comfortable',
                    leading: <Rows3 size={13} strokeWidth={1.75} />,
                  },
                  {
                    value: 'compact',
                    label: 'Compact',
                    leading: <AlignJustify size={13} strokeWidth={1.75} />,
                  },
                ]}
              />
            </FieldGroup>

            <FieldGroup label="Corner radius">
              <SegmentedControl
                value={String(draft.appearance.radius)}
                onChange={v => patch({ radius: Number(v) })}
                options={RADIUS_OPTIONS.map(o => ({
                  value: String(o.value),
                  label: o.label,
                  leading: <RadiusGlyph rem={o.value} />,
                }))}
              />
            </FieldGroup>
          </div>
        </Tile>

        {/* ========== Full-width preset strip tile ========== */}
        <Tile
          id="appearance-presets"
          layoutMode="block"
          background="card"
          borderRadius="lg"
          padding="p-4"
          className="border"
          style={{ borderColor: border.default }}
        >
          <FieldGroup
            label="Preset"
            headerRight={isCustom ? <CustomPaletteChip /> : null}
          >
            <PresetStrip
              presets={APPEARANCE_PRESETS}
              activeId={draft.appearance.presetId}
              onSelect={handlePreset}
            />
          </FieldGroup>
        </Tile>

        {/* ========== Reset button ========== */}
        <div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-sm"
            style={{ gap: spacing['2'] }}
          >
            <RotateCcw style={{ width: '14px', height: '14px' }} />
            Reset to Sanketa Classic
          </Button>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Custom-palette indicator — shows next to the Preset label when the user
// has drifted the picker off any named preset.
// ============================================================================

function CustomPaletteChip() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{
        padding: '2px 8px',
        backgroundColor: 'color-mix(in srgb, var(--primary) 35%, white)',
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
// Preset strip — horizontal scroll row; each card gets a fixed flex-basis so
// adding more presets keeps cards the same width and overflows to scroll.
// ============================================================================

function PresetStrip({
  presets,
  activeId,
  onSelect,
}: {
  presets: typeof APPEARANCE_PRESETS
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      className="flex overflow-x-auto"
      style={{
        gap: spacing['2'],
        paddingTop: '3px',
        paddingBottom: '6px',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        scrollSnapType: 'x proximity',
        scrollbarWidth: 'thin',
      }}
    >
      {presets.map(preset => (
        <div
          key={preset.id}
          style={{
            flex: '0 0 200px',
            flexShrink: 0,
            flexGrow: 0,
            scrollSnapAlign: 'start',
          }}
        >
          <PresetCard
            preset={preset}
            active={activeId === preset.id}
            onSelect={() => onSelect(preset.id)}
          />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Radius glyph — small outlined square whose corner radius matches the option
// ============================================================================

function RadiusGlyph({ rem }: { rem: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '11px',
        height: '11px',
        border: '1.5px solid currentColor',
        borderRadius: `${Math.min(rem * 4, 5)}px`,
        pointerEvents: 'none',
      }}
    />
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
      className="flex items-center rounded-lg border"
      style={{
        padding: `${spacing['2']} ${spacing['2.5']}`,
        borderColor: border.default,
        backgroundColor: background.card,
        gap: spacing['2.5'],
      }}
    >
      <div
        className="rounded-md shrink-0"
        style={{
          width: '22px',
          height: '22px',
          backgroundColor: value,
          border: `1px solid ${border.default}`,
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
      {showContrast && <ContrastBadge fg={value} />}
    </div>
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

interface SegmentedOption {
  value: string
  label: string
  leading?: React.ReactNode
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: SegmentedOption[]
}) {
  return (
    <div
      className="inline-flex rounded-lg"
      style={{
        backgroundColor: background.page,
        border: `1px solid ${border.default}`,
        padding: '3px',
      }}
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex items-center rounded-md transition-all text-xs font-medium cursor-pointer"
            style={{
              padding: `${spacing['1.5']} ${spacing['3']}`,
              gap: spacing['1.5'],
              backgroundColor: active ? background.card : 'transparent',
              color: active ? 'var(--heading)' : text.muted,
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {opt.leading}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
