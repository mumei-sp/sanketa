/**
 * Appearance studio visual atoms — mode scene cards, the live preview
 * mini-app, preset gallery cards, and the density / radius option cards.
 *
 * Everything here is presentational and theme-reactive: components read the
 * live CSS variables (or the preset palette passed in), so the studio repaints
 * the instant a draft value changes. State lives in AppearanceSettingsSection.
 */

import * as React from 'react'
import { Sun, Moon, MonitorSmartphone, Check, Search } from 'lucide-react'
import type { AppearancePreset, ThemeMode } from '@/theme/appearance'

// ============================================================================
// Mode selector — three miniature "window" scenes: Light / Dark / Auto
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
  bg: '#131418',
  card: '#1f2127',
  text: '#e8eaf0',
  textDim: 'rgba(232, 234, 240, 0.38)',
}

export function ModeSelector({ value, onChange, primary, accent, heading }: ModeSelectorProps) {
  const items: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', Icon: Sun },
    { mode: 'dark', label: 'Dark', Icon: Moon },
    { mode: 'system', label: 'Auto', Icon: MonitorSmartphone },
  ]

  return (
    <div role="radiogroup" aria-label="Theme mode" className="grid grid-cols-3 gap-2.5">
      {items.map(({ mode, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className="group relative flex flex-col overflow-hidden rounded-xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{
              boxShadow: active
                ? '0 0 0 1.5px var(--heading), 0 10px 24px -10px color-mix(in srgb, var(--heading) 45%, transparent)'
                : 'inset 0 0 0 1px var(--border), 0 1px 2px rgb(21 68 110 / 0.03)',
              backgroundColor: 'var(--card)',
            }}
          >
            {/* Scene */}
            <div className="relative h-16 w-full overflow-hidden">
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
              className="flex items-center justify-between px-2.5 py-2 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold"
                style={{ color: active ? 'var(--heading)' : 'var(--muted-foreground)' }}
              >
                <Icon size={12} strokeWidth={2.25} />
                {label}
              </span>
              <span
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: '15px',
                  height: '15px',
                  backgroundColor: active ? 'var(--heading)' : 'transparent',
                  boxShadow: active ? 'none' : 'inset 0 0 0 1.5px var(--border)',
                }}
              >
                {active && <Check size={9} strokeWidth={3.5} style={{ color: 'var(--card)' }} />}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SceneLight({ primary, accent, heading }: { primary: string; accent: string; heading: string }) {
  return (
    <div className="absolute inset-0 flex gap-1 p-1.5" style={{ backgroundColor: '#f2f5f9' }}>
      {/* mini sidebar */}
      <div className="h-full w-[26%] rounded-md bg-white p-1 flex flex-col gap-[3px]">
        <div className="h-[6px] w-full rounded-full" style={{ backgroundColor: primary }} />
        <div className="h-[3px] w-4/5 rounded-full" style={{ backgroundColor: heading, opacity: 0.18 }} />
        <div className="h-[3px] w-3/5 rounded-full" style={{ backgroundColor: heading, opacity: 0.18 }} />
      </div>
      {/* mini content */}
      <div className="flex-1 rounded-md bg-white p-1.5 flex flex-col gap-1">
        <div className="h-[4px] w-1/2 rounded-full" style={{ backgroundColor: heading, opacity: 0.85 }} />
        <div className="flex items-end gap-[3px] flex-1">
          {[50, 82, 62, 100, 72, 88].map((h, i) => (
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
        className="h-full w-[26%] rounded-md p-1 flex flex-col gap-[3px]"
        style={{ backgroundColor: DARK_SCENE.card }}
      >
        <div className="h-[6px] w-full rounded-full" style={{ backgroundColor: primary, opacity: 0.9 }} />
        <div className="h-[3px] w-4/5 rounded-full" style={{ backgroundColor: DARK_SCENE.textDim }} />
        <div className="h-[3px] w-3/5 rounded-full" style={{ backgroundColor: DARK_SCENE.textDim }} />
      </div>
      <div
        className="flex-1 rounded-md p-1.5 flex flex-col gap-1"
        style={{ backgroundColor: DARK_SCENE.card }}
      >
        <div className="h-[4px] w-1/2 rounded-full" style={{ backgroundColor: DARK_SCENE.text, opacity: 0.85 }} />
        <div className="flex items-end gap-[3px] flex-1">
          {[50, 82, 62, 100, 72, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h}%`,
                backgroundColor: primary,
                opacity: i === 3 ? 1 : 0.3 + i * 0.09,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LivePreviewPanel — a faux Sanketa mini-app reading live CSS vars, so the
// draft appearance renders here the moment a handle moves or a preset lands.
// ============================================================================

export function LivePreviewPanel() {
  const perfBars = [38, 60, 46, 76, 56, 92, 68]

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden h-full min-w-0"
      style={{
        minHeight: '320px',
        boxShadow: 'inset 0 0 0 1px var(--border), 0 8px 24px -12px rgb(21 68 110 / 0.14)',
        backgroundColor: 'var(--background)',
        transition: 'background-color 200ms ease',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex gap-1.5 shrink-0">
          {['var(--primary)', 'var(--accent)', 'var(--heading)'].map((c, i) => (
            <span key={i} className="rounded-full" style={{ width: '7px', height: '7px', backgroundColor: c, transition: 'background-color 200ms ease' }} />
          ))}
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.14em] whitespace-nowrap"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Live preview
        </span>
      </div>

      {/* App shell: rail + content */}
      <div className="flex flex-1 min-h-0">
        {/* Nav rail */}
        <div
          className="flex flex-col items-center gap-2 py-2.5 px-1.5 border-r shrink-0"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border-subtle)' }}
        >
          <span className="rounded-full" style={{ width: '10px', height: '10px', backgroundColor: 'var(--heading)' }} />
          <span
            className="rounded-md"
            style={{ width: '18px', height: '18px', backgroundColor: 'var(--primary)', transition: 'background-color 200ms ease' }}
          />
          {[0.35, 0.25, 0.18].map((op, i) => (
            <span key={i} className="rounded-md" style={{ width: '18px', height: '18px', backgroundColor: 'var(--heading)', opacity: op * 0.5, borderRadius: '5px' }} />
          ))}
          <span className="mt-auto rounded-full" style={{ width: '14px', height: '14px', backgroundColor: 'var(--accent)', transition: 'background-color 200ms ease' }} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-2 flex-1 min-w-0">
          {/* Header: title + search pill */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold tracking-tight truncate" style={{ color: 'var(--heading)' }}>
              Dashboard
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 shrink-0"
              style={{ backgroundColor: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--border)' }}
            >
              <Search size={8} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-[8px]" style={{ color: 'var(--muted-foreground)' }}>Search</span>
            </span>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Students', value: '1,284', iconBg: 'var(--heading)', dot: 'var(--card)' },
              { label: 'Attendance', value: '94.6%', iconBg: 'var(--primary)', dot: 'var(--primary-foreground)' },
            ].map(t => (
              <div
                key={t.label}
                className="p-1.5 flex items-center justify-between gap-1 min-w-0"
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'calc(var(--radius) * 0.7)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'border-radius 200ms ease',
                }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {t.label}
                  </span>
                  <span className="text-[12px] font-extrabold leading-tight tracking-tight truncate" style={{ color: 'var(--heading)' }}>
                    {t.value}
                  </span>
                </div>
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: '18px', height: '18px', backgroundColor: t.iconBg, transition: 'background-color 200ms ease' }}
                >
                  <span className="rounded-full" style={{ width: '6px', height: '6px', backgroundColor: t.dot }} />
                </span>
              </div>
            ))}
          </div>

          {/* Chart + donut row */}
          <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            {/* Bars */}
            <div
              className="p-2 flex flex-col min-h-0"
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'calc(var(--radius) * 0.7)',
                boxShadow: 'var(--shadow-card)',
                transition: 'border-radius 200ms ease',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold" style={{ color: 'var(--heading)' }}>Performance</span>
                <span
                  className="text-[7px] font-bold rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', transition: 'background-color 200ms ease' }}
                >
                  Weekly
                </span>
              </div>
              <div className="flex items-end gap-1 flex-1 min-h-7">
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
            {/* Donut */}
            <div
              className="p-2 flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'calc(var(--radius) * 0.7)',
                boxShadow: 'var(--shadow-card)',
                transition: 'border-radius 200ms ease',
              }}
            >
              <div
                className="relative rounded-full"
                style={{
                  width: '44px',
                  height: '44px',
                  background:
                    'conic-gradient(var(--heading) 0 52%, var(--primary) 52% 86%, var(--accent) 86% 100%)',
                  transition: 'background 200ms ease',
                }}
              >
                <span
                  className="absolute inset-[7px] rounded-full flex items-center justify-center text-[9px] font-extrabold"
                  style={{ backgroundColor: 'var(--card)', color: 'var(--heading)' }}
                >
                  99
                </span>
              </div>
              <span className="text-[8px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                By gender
              </span>
            </div>
          </div>

          {/* Table rows */}
          <div
            className="flex flex-col"
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'calc(var(--radius) * 0.7)',
              boxShadow: 'var(--shadow-card)',
              transition: 'border-radius 200ms ease',
            }}
          >
            {[
              { w: '42%', pill: 'Active', pillBg: '#E7F6EE', pillFg: '#166534' },
              { w: '55%', pill: 'Pending', pillBg: 'var(--primary)', pillFg: 'var(--primary-foreground)' },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5"
                style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}
              >
                <span className="rounded-full shrink-0" style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent)', transition: 'background-color 200ms ease' }} />
                <span className="h-[4px] rounded-full" style={{ width: r.w, backgroundColor: 'var(--heading)', opacity: 0.3 }} />
                <span
                  className="ml-auto text-[7px] font-bold rounded-full px-1.5 py-[2px] shrink-0"
                  style={{ backgroundColor: r.pillBg, color: r.pillFg, transition: 'background-color 200ms ease' }}
                >
                  {r.pill}
                </span>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold px-2.5 py-1"
              style={{
                backgroundColor: 'var(--heading)',
                color: 'var(--card)',
                borderRadius: 'calc(var(--radius) * 0.55)',
                transition: 'border-radius 200ms ease',
              }}
            >
              Primary
            </span>
            <span
              className="text-[9px] font-bold px-2.5 py-1"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'calc(var(--radius) * 0.55)',
                transition: 'background-color 200ms ease, border-radius 200ms ease',
              }}
            >
              Soft
            </span>
            <span
              className="text-[8px] font-semibold rounded-full px-2 py-0.5 ml-auto"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', transition: 'background-color 200ms ease' }}
            >
              12 pending
            </span>
          </div>
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
      className="group relative flex flex-col w-full rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        boxShadow: active
          ? `0 0 0 1.5px ${heading}, 0 10px 24px -10px ${tint(heading, 0.4)}`
          : 'inset 0 0 0 1px var(--border), 0 1px 2px rgb(21 68 110 / 0.03)',
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

      {/* Miniature dashboard on a soft brand wash */}
      <div
        className="p-2"
        style={{
          background: `linear-gradient(135deg, ${tint(primary, 0.22)} 0%, ${tint(accent, 0.2)} 100%)`,
        }}
      >
        <div
          className="flex h-[92px] w-full overflow-hidden rounded-lg bg-white transition-transform duration-200 group-hover:scale-[1.02]"
          style={{ boxShadow: `0 3px 10px -2px ${tint(heading, 0.22)}` }}
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
            <div className="flex gap-1">
              {[heading, primary].map((c, i) => (
                <div key={i} className="flex-1 rounded-[4px] p-1 flex items-center gap-1" style={{ backgroundColor: tint(heading, 0.05) }}>
                  <span className="rounded-full shrink-0" style={{ width: '8px', height: '8px', backgroundColor: c }} />
                  <span className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: heading, opacity: 0.35 }} />
                </div>
              ))}
            </div>
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
// Option card — glyph + label card for density / radius pickers
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
      className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        boxShadow: active
          ? '0 0 0 1.5px var(--heading), 0 8px 20px -10px color-mix(in srgb, var(--heading) 40%, transparent)'
          : 'inset 0 0 0 1px var(--border)',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--accent) 20%, var(--card))'
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
        className="text-[11px] font-bold"
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
