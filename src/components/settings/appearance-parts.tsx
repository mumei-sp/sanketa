/**
 * Appearance section visual atoms — the theme studio building blocks.
 *
 * Everything here is presentational: mode scene cards, preset gallery cards
 * with live miniature mockups, the live preview panel, and the small option
 * cards used for density / radius. State lives in AppearanceSettingsSection.
 */

import * as React from 'react'
import { Sun, Moon, MonitorSmartphone, Check } from 'lucide-react'
import type { AppearancePreset, ThemeMode } from '@/theme/appearance'

// ============================================================================
// Mode selector — three miniature "window" scenes: Light / Dark / System
// ============================================================================

interface ModeSelectorProps {
  value: ThemeMode
  onChange: (v: ThemeMode) => void
  /** Light-mode brand anchors from the draft — scenes render with them. */
  primary: string
  accent: string
  heading: string
}

const DARK_SCENE = {
  bg: '#141519',
  card: '#212329',
  text: '#e8eaf0',
  textDim: 'rgba(232, 234, 240, 0.4)',
}

export function ModeSelector({ value, onChange, primary, accent, heading }: ModeSelectorProps) {
  const items: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', Icon: Sun },
    { mode: 'dark', label: 'Dark', Icon: Moon },
    { mode: 'system', label: 'Auto', Icon: MonitorSmartphone },
  ]

  return (
    <div role="radiogroup" aria-label="Theme mode" className="grid grid-cols-3 gap-2">
      {items.map(({ mode, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className="group relative flex flex-col overflow-hidden rounded-xl border text-left cursor-pointer transition-all duration-200"
            style={{
              borderColor: active ? 'var(--heading)' : 'var(--border)',
              boxShadow: active
                ? '0 0 0 1px var(--heading), 0 4px 12px -4px rgb(21 68 110 / 0.2)'
                : 'none',
              backgroundColor: 'var(--card)',
            }}
          >
            {/* Scene */}
            <div className="relative h-14 w-full overflow-hidden">
              {mode !== 'dark' && <SceneLight primary={primary} accent={accent} heading={heading} />}
              {mode !== 'light' && (
                <div
                  className="absolute inset-0"
                  style={
                    mode === 'system'
                      ? { clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)' }
                      : undefined
                  }
                >
                  <SceneDark primary={primary} />
                </div>
              )}
            </div>
            {/* Label row */}
            <div
              className="flex items-center justify-between px-2.5 py-1.5 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: active ? 'var(--heading)' : 'var(--muted-foreground)' }}
              >
                <Icon size={12} strokeWidth={2} />
                {label}
              </span>
              {active && (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: '14px', height: '14px', backgroundColor: 'var(--heading)' }}
                >
                  <Check size={9} strokeWidth={3.5} style={{ color: 'var(--card)' }} />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SceneLight({ primary, accent, heading }: { primary: string; accent: string; heading: string }) {
  return (
    <div className="absolute inset-0 flex gap-1 p-1.5" style={{ backgroundColor: '#f3f6fa' }}>
      {/* mini sidebar */}
      <div className="h-full w-[26%] rounded-[5px] bg-white p-1 flex flex-col gap-[3px]">
        <div className="h-[5px] w-full rounded-full" style={{ backgroundColor: primary }} />
        <div className="h-[3px] w-4/5 rounded-full" style={{ backgroundColor: heading, opacity: 0.18 }} />
        <div className="h-[3px] w-3/5 rounded-full" style={{ backgroundColor: heading, opacity: 0.18 }} />
      </div>
      {/* mini content */}
      <div className="flex-1 rounded-[5px] bg-white p-1.5 flex flex-col gap-[4px]">
        <div className="h-[4px] w-1/2 rounded-full" style={{ backgroundColor: heading, opacity: 0.85 }} />
        <div className="flex items-end gap-[3px] flex-1">
          {[55, 85, 65, 100, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h}%`,
                backgroundColor: i === 3 ? heading : i % 2 ? accent : primary,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SceneDark({ primary }: { primary: string }) {
  return (
    <div className="absolute inset-0 flex gap-1 p-1.5" style={{ backgroundColor: DARK_SCENE.bg }}>
      <div
        className="h-full w-[26%] rounded-[5px] p-1 flex flex-col gap-[3px]"
        style={{ backgroundColor: DARK_SCENE.card }}
      >
        <div className="h-[5px] w-full rounded-full" style={{ backgroundColor: primary, opacity: 0.9 }} />
        <div className="h-[3px] w-4/5 rounded-full" style={{ backgroundColor: DARK_SCENE.textDim }} />
        <div className="h-[3px] w-3/5 rounded-full" style={{ backgroundColor: DARK_SCENE.textDim }} />
      </div>
      <div
        className="flex-1 rounded-[5px] p-1.5 flex flex-col gap-[4px]"
        style={{ backgroundColor: DARK_SCENE.card }}
      >
        <div className="h-[4px] w-1/2 rounded-full" style={{ backgroundColor: DARK_SCENE.text, opacity: 0.85 }} />
        <div className="flex items-end gap-[3px] flex-1">
          {[55, 85, 65, 100, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h}%`,
                backgroundColor: primary,
                opacity: i === 3 ? 1 : 0.35 + i * 0.08,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Preset card — a miniature Sanketa dashboard rendered in the preset palette
// ============================================================================

export function PresetCard({
  preset,
  active,
  onSelect,
}: {
  preset: AppearancePreset
  active: boolean
  onSelect: () => void
}) {
  const { primary, accent, heading } = preset
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="group relative flex flex-col w-full rounded-xl overflow-hidden border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: active ? heading : 'var(--border)',
        boxShadow: active
          ? `0 0 0 1px ${heading}, 0 6px 16px -6px ${tint(heading, 0.35)}`
          : 'none',
        backgroundColor: 'var(--card)',
      }}
    >
      {active && (
        <span
          className="absolute z-10 flex items-center justify-center rounded-full shadow-sm"
          style={{ top: '8px', right: '8px', width: '18px', height: '18px', backgroundColor: heading }}
        >
          <Check size={11} strokeWidth={3} style={{ color: '#ffffff' }} />
        </span>
      )}

      {/* Miniature dashboard */}
      <div className="p-2" style={{ backgroundColor: tint(primary, 0.16) }}>
        <div
          className="flex h-[92px] w-full overflow-hidden rounded-lg bg-white"
          style={{ boxShadow: `0 2px 8px -2px ${tint(heading, 0.18)}` }}
        >
          {/* sidebar */}
          <div
            className="h-full w-[24%] p-1.5 flex flex-col gap-1"
            style={{ borderRight: `1px solid ${tint(heading, 0.08)}` }}
          >
            <div className="flex items-center gap-[3px]">
              <span className="rounded-full" style={{ width: '5px', height: '5px', backgroundColor: heading }} />
              <span className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: heading, opacity: 0.3 }} />
            </div>
            <div className="h-[8px] w-full rounded-[3px] mt-0.5" style={{ backgroundColor: primary }} />
            {[0.8, 0.6, 0.7].map((w, i) => (
              <span key={i} className="h-[3px] rounded-full" style={{ width: `${w * 100}%`, backgroundColor: heading, opacity: 0.15 }} />
            ))}
          </div>
          {/* content */}
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            {/* stat row */}
            <div className="flex gap-1">
              <div className="flex-1 rounded-[4px] p-1 flex items-center gap-1" style={{ backgroundColor: tint(heading, 0.05) }}>
                <span className="rounded-full shrink-0" style={{ width: '8px', height: '8px', backgroundColor: heading }} />
                <span className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: heading, opacity: 0.35 }} />
              </div>
              <div className="flex-1 rounded-[4px] p-1 flex items-center gap-1" style={{ backgroundColor: tint(heading, 0.05) }}>
                <span className="rounded-full shrink-0" style={{ width: '8px', height: '8px', backgroundColor: primary }} />
                <span className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: heading, opacity: 0.35 }} />
              </div>
            </div>
            {/* chart */}
            <div className="flex items-end gap-[3px] flex-1 px-0.5">
              {[45, 70, 55, 95, 65, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[2px]"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 3 ? heading : i % 2 ? accent : primary,
                  }}
                />
              ))}
            </div>
            {/* pill row */}
            <div className="flex items-center gap-1">
              <span className="h-[7px] w-[26px] rounded-full" style={{ backgroundColor: accent }} />
              <span className="h-[7px] w-[18px] rounded-full" style={{ backgroundColor: primary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Label strip */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col min-w-0">
          <span
            className="text-xs truncate"
            style={{ color: 'var(--heading)', fontWeight: active ? 700 : 600 }}
          >
            {preset.label}
          </span>
          <span
            className="text-[10px] truncate"
            style={{ color: 'var(--muted-foreground)', marginTop: '1px' }}
          >
            {preset.description}
          </span>
        </div>
        <div className="flex -space-x-1.5 shrink-0">
          <Swatch color={primary} />
          <Swatch color={accent} />
          <Swatch color={heading} />
        </div>
      </div>
    </button>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="rounded-full"
      style={{
        width: '14px',
        height: '14px',
        backgroundColor: color,
        border: '2px solid var(--card)',
        display: 'inline-block',
      }}
    />
  )
}

/** rgba() tint of a hex color — used for washes and soft shadows. */
function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

// ============================================================================
// LivePreviewPanel — a faux Sanketa slice reading live CSS vars, so the draft
// appearance renders here the moment the user drags a handle or picks a preset.
// ============================================================================

export function LivePreviewPanel() {
  const perfBars = [40, 62, 48, 78, 58, 92, 70]

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden h-full"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
        transition: 'background-color 200ms ease',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex gap-1">
          {['var(--primary)', 'var(--accent)', 'var(--heading)'].map((c, i) => (
            <span key={i} className="rounded-full" style={{ width: '7px', height: '7px', backgroundColor: c }} />
          ))}
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Live preview
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-2.5 flex-1">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="p-2 flex items-center justify-between gap-1.5"
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'calc(var(--radius) * 0.75)',
              boxShadow: 'var(--shadow-card)',
              transition: 'border-radius 200ms ease',
            }}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>
                Students
              </span>
              <span className="text-sm font-extrabold leading-tight" style={{ color: 'var(--heading)' }}>
                1,284
              </span>
            </div>
            <span
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: '20px', height: '20px', backgroundColor: 'var(--heading)' }}
            >
              <span className="rounded-full" style={{ width: '7px', height: '7px', backgroundColor: 'var(--card)' }} />
            </span>
          </div>
          <div
            className="p-2 flex items-center justify-between gap-1.5"
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'calc(var(--radius) * 0.75)',
              boxShadow: 'var(--shadow-card)',
              transition: 'border-radius 200ms ease',
            }}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>
                Attendance
              </span>
              <span className="text-sm font-extrabold leading-tight" style={{ color: 'var(--heading)' }}>
                94.6%
              </span>
            </div>
            <span
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: '20px', height: '20px', backgroundColor: 'var(--primary)' }}
            >
              <span className="rounded-full" style={{ width: '7px', height: '7px', backgroundColor: 'var(--primary-foreground)' }} />
            </span>
          </div>
        </div>

        {/* Chart card */}
        <div
          className="p-2 flex-1 flex flex-col"
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'calc(var(--radius) * 0.75)',
            boxShadow: 'var(--shadow-card)',
            transition: 'border-radius 200ms ease',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold" style={{ color: 'var(--heading)' }}>
              Performance
            </span>
            <span
              className="text-[8px] font-semibold rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              Weekly
            </span>
          </div>
          <div className="flex items-end gap-1 flex-1 min-h-8">
            {perfBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[3px]"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 5 ? 'var(--heading)' : i % 2 ? 'var(--accent)' : 'var(--primary)',
                  transition: 'background-color 200ms ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2.5 py-1"
            style={{
              backgroundColor: 'var(--heading)',
              color: 'var(--card)',
              borderRadius: 'calc(var(--radius) * 0.6)',
              transition: 'border-radius 200ms ease',
            }}
          >
            Primary
          </span>
          <span
            className="text-[10px] font-bold px-2.5 py-1"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'calc(var(--radius) * 0.6)',
              transition: 'background-color 200ms ease, border-radius 200ms ease',
            }}
          >
            Soft
          </span>
          <span
            className="text-[9px] font-semibold rounded-full px-2 py-0.5 ml-auto"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
          >
            12 pending
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Option card — small glyph + label card for density / radius pickers
// ============================================================================

export function OptionCard({
  label,
  active,
  onSelect,
  children,
}: {
  label: string
  active: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="flex flex-col items-center gap-1.5 rounded-xl border p-2.5 cursor-pointer transition-all duration-200"
      style={{
        borderColor: active ? 'var(--heading)' : 'var(--border)',
        boxShadow: active ? '0 0 0 1px var(--heading)' : 'none',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--accent) 18%, var(--card))'
          : 'var(--card)',
      }}
    >
      <span
        className="flex items-center justify-center h-9 w-full"
        style={{ color: active ? 'var(--heading)' : 'var(--muted-foreground)' }}
      >
        {children}
      </span>
      <span
        className="text-[11px] font-semibold"
        style={{ color: active ? 'var(--heading)' : 'var(--muted-foreground)' }}
      >
        {label}
      </span>
    </button>
  )
}

/** Density glyph — stacked rows at the option's tightness. */
export function DensityGlyph({ compact }: { compact: boolean }) {
  const rows = compact ? 4 : 3
  const gap = compact ? 2 : 4
  return (
    <span className="flex flex-col justify-center" style={{ gap: `${gap}px`, width: '34px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            height: compact ? '3px' : '4px',
            backgroundColor: 'currentColor',
            opacity: 0.75,
            width: i === rows - 1 ? '70%' : '100%',
          }}
        />
      ))}
    </span>
  )
}

/** Radius glyph — a card corner drawn at the option's radius. */
export function RadiusGlyph({ rem }: { rem: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '26px',
        height: '22px',
        border: '2px solid currentColor',
        borderRight: 'none',
        borderBottom: 'none',
        borderTopLeftRadius: `${rem * 12}px`,
        opacity: 0.85,
      }}
    />
  )
}
