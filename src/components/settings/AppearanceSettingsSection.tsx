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
import { RotateCcw } from 'lucide-react'
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
import { text, border, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { ThemeModeToggle, PresetCard } from './appearance-parts'

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

  return (
    <>
      <SectionHeading
        title="Appearance"
        description="Theme, brand colors, density, and radius."
      />

      <FieldGroup label="Theme mode">
        <ThemeModeToggle
          value={draft.appearance.mode}
          onChange={v => patch({ mode: v as ThemeMode })}
        />
      </FieldGroup>

      <FieldGroup label="Preset">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
        >
          {APPEARANCE_PRESETS.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              active={draft.appearance.presetId === preset.id}
              onSelect={() => handlePreset(preset.id)}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Brand colors" hint="Drag the light handle for primary, dark handle for text anchor.">
        <div className="flex items-start" style={{ gap: spacing['4'] }}>
          <ArcColorPicker
            primary={draft.appearance.primary}
            heading={draft.appearance.heading}
            onChange={handlePickerChange}
            onInvert={handleInvert}
            onReset={handleReset}
          />
          <div className="flex-1 flex flex-col" style={{ gap: spacing['2'] }}>
            <HexReadout label="Primary" value={draft.appearance.primary} />
            <HexReadout label="Accent" value={draft.appearance.accent} />
            <HexReadout label="Heading" value={draft.appearance.heading} />
          </div>
        </div>
      </FieldGroup>

      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 1fr', gap: spacing['5'] }}
      >
        <FieldGroup label="Density">
          <SegmentedControl
            value={draft.appearance.density}
            onChange={v => patch({ density: v as Density })}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
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
            }))}
          />
        </FieldGroup>
      </div>

      <div style={{ marginTop: spacing['2'] }}>
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
    </>
  )
}

// ============================================================================
// HEX readout chip — live color swatch + monospaced hex label
// ============================================================================

function HexReadout({ label, value }: { label: string; value: string }) {
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
        }}
      />
      <div className="flex flex-col min-w-0">
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
    </div>
  )
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
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      <label
        className="text-sm font-semibold"
        style={{ color: 'var(--heading)' }}
      >
        {label}
      </label>
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
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
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
        const Icon = opt.icon
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
            {Icon && <Icon size={13} strokeWidth={1.5} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
