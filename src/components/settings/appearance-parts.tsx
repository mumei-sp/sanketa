/**
 * Appearance section visual atoms — the polished theme-mode pill and
 * preset cards that ship a real UI preview instead of flat color chips.
 *
 * The theme-mode pill is adapted from Cuicui's PillToggleTheme
 * (https://github.com/damien-schneider/cuicui, MIT) — their animated
 * sun/moon slide, but with all three modes always visible in a single
 * capsule since this lives in a settings pane.
 */

import * as React from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import type { AppearancePreset } from '@/theme/appearance'
import type { ThemeMode } from '@/theme/appearance'

// ============================================================================
// Theme mode pill — horizontal capsule, animated active indicator
// ============================================================================

const MODE_ITEMS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export function ThemeModeToggle({
  value,
  onChange,
}: {
  value: ThemeMode
  onChange: (v: ThemeMode) => void
}) {
  const activeIndex = MODE_ITEMS.findIndex(m => m.value === value)

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="relative grid rounded-full p-1 border w-full"
      style={{
        gridTemplateColumns: `repeat(${MODE_ITEMS.length}, minmax(0, 1fr))`,
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Sliding active indicator — covers exactly one column */}
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${MODE_ITEMS.length})`,
          left: '0.25rem',
          transform: `translateX(calc(${activeIndex} * 100%))`,
          backgroundColor: 'var(--primary)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--border)',
        }}
      />
      {MODE_ITEMS.map(item => {
        const active = item.value === value
        const Icon = item.Icon
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.value)}
            className="relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold cursor-pointer transition-colors"
            style={{
              color: active ? 'var(--heading)' : 'var(--muted-foreground)',
              minWidth: '72px',
            }}
          >
            <Icon
              size={13}
              strokeWidth={1.75}
              className={
                active
                  ? 'transition-transform duration-300 scale-110'
                  : 'transition-transform duration-300'
              }
            />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Preset card — a mini Sanketa mockup rendered in the preset's palette
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
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="group relative flex flex-col w-full rounded-xl overflow-hidden border text-left cursor-pointer hover:-translate-y-[1px]"
      style={{
        borderColor: active ? preset.heading : 'var(--border)',
        boxShadow: active ? `0 0 0 1.5px ${preset.heading}` : 'none',
        backgroundColor: 'var(--card)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
    >
      {/* Active check badge */}
      {active && (
        <div
          className="absolute z-10 rounded-full flex items-center justify-center shadow-sm"
          style={{
            top: '8px',
            right: '8px',
            width: '18px',
            height: '18px',
            backgroundColor: preset.heading,
          }}
        >
          <Check size={11} strokeWidth={3} style={{ color: '#ffffff' }} />
        </div>
      )}
      {/* Mini mockup */}
      <div
        className="relative h-24 w-full flex"
        style={{ backgroundColor: mixedBg(preset.primary) }}
      >
        {/* Sidebar stripe */}
        <div
          className="h-full flex flex-col gap-1 px-1.5 pt-2"
          style={{
            width: '22%',
            backgroundColor: '#ffffff',
            borderRight: `1px solid ${mixedBorder(preset.heading)}`,
          }}
        >
          <div
            className="h-1 rounded-full"
            style={{ width: '70%', backgroundColor: preset.heading, opacity: 0.4 }}
          />
          <div
            className="h-2 rounded-md mt-1"
            style={{ backgroundColor: preset.primary }}
          />
          <div
            className="h-1 rounded-full"
            style={{ width: '80%', backgroundColor: preset.heading, opacity: 0.2 }}
          />
          <div
            className="h-1 rounded-full"
            style={{ width: '60%', backgroundColor: preset.heading, opacity: 0.2 }}
          />
          <div
            className="h-1 rounded-full"
            style={{ width: '70%', backgroundColor: preset.heading, opacity: 0.2 }}
          />
        </div>
        {/* Main area */}
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          {/* Card row */}
          <div
            className="rounded-md flex items-center justify-between px-1.5 py-1"
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${mixedBorder(preset.heading)}`,
            }}
          >
            <div
              className="h-1 rounded-full"
              style={{ width: '30%', backgroundColor: preset.heading, opacity: 0.6 }}
            />
            <div
              className="rounded-full"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: preset.accent,
              }}
            />
          </div>
          {/* Chip + button */}
          <div className="flex items-center gap-1 mt-auto">
            <div
              className="rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: preset.accent,
                fontSize: '7px',
                color: preset.heading,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Chip
            </div>
            <div
              className="rounded-md px-2 py-1"
              style={{
                backgroundColor: preset.primary,
                fontSize: '7px',
                color: preset.heading,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Action
            </div>
          </div>
        </div>
      </div>

      {/* Label strip */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col min-w-0">
          <span
            className="text-xs truncate"
            style={{
              color: 'var(--heading)',
              fontWeight: active ? 600 : 500,
            }}
          >
            {preset.label}
          </span>
        </div>
        <div className="flex -space-x-1.5 shrink-0">
          <Swatch color={preset.primary} />
          <Swatch color={preset.accent} />
          <Swatch color={preset.heading} />
        </div>
      </div>
    </button>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <div
      className="rounded-full border-2 border-white"
      style={{ width: '14px', height: '14px', backgroundColor: color }}
    />
  )
}

// ============================================================================
// Small color utilities — soften / border tint for the mini preview
// ============================================================================

function mixedBg(primaryHex: string): string {
  // Very light tint of primary for the mini-mockup backdrop
  const [r, g, b] = hexToRgb(primaryHex)
  return `rgba(${r}, ${g}, ${b}, 0.18)`
}

function mixedBorder(headingHex: string): string {
  const [r, g, b] = hexToRgb(headingHex)
  return `rgba(${r}, ${g}, ${b}, 0.14)`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

// ============================================================================
// LivePreviewPanel — faux Sanketa slice that reads live CSS vars so the draft
// appearance renders here the moment the user drags a handle or picks a preset.
// ============================================================================

export function LivePreviewPanel() {
  const attendanceBars = [40, 72, 55, 88, 64, 92, 76]
  const perfBars = [35, 55, 42, 70, 58, 82, 65]

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)',
        backgroundColor: 'var(--card)',
        transition: 'background-color 200ms ease',
      }}
    >
      {/* Header strip — mix against the card surface so the tint reads as a
          wash of accent in both light and dark mode */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent) 28%, var(--card))',
          borderColor: 'var(--border)',
          transition: 'background-color 200ms ease',
        }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--heading)' }}
        >
          Live preview
        </span>
        <div className="flex gap-1">
          {[0.6, 0.35, 0.2].map((op, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--heading)',
                opacity: op,
              }}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        {/* Stat tile row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Plain stat */}
          <div
            className="border p-2.5 flex flex-col"
            style={{
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius)',
              transition: 'border-radius 200ms ease',
            }}
          >
            <span
              className="text-[9px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground, #00110B)', opacity: 0.7 }}
            >
              Students
            </span>
            <span
              className="text-lg font-bold leading-tight"
              style={{ color: 'var(--heading)' }}
            >
              1,284
            </span>
            <span
              className="inline-flex items-center rounded-full w-fit mt-1"
              style={{
                padding: '1px 6px',
                fontSize: '9px',
                fontWeight: 600,
                backgroundColor: 'color-mix(in srgb, var(--primary) 40%, var(--card))',
                color: 'var(--heading)',
                transition: 'background-color 200ms ease',
              }}
            >
              +24 this term
            </span>
          </div>
          {/* Primary-filled stat */}
          <div
            className="p-2.5 flex flex-col"
            style={{
              backgroundColor: 'var(--primary)',
              borderRadius: 'var(--radius)',
              transition: 'background-color 200ms ease, border-radius 200ms ease',
            }}
          >
            <span
              className="text-[9px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--primary-foreground)', opacity: 0.75 }}
            >
              Attendance
            </span>
            <span
              className="text-lg font-bold leading-tight"
              style={{ color: 'var(--primary-foreground)' }}
            >
              94.6%
            </span>
            <div className="mt-1 flex items-end gap-0.5 h-3">
              {attendanceBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: 'var(--primary-foreground)',
                    opacity: 0.45,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mini chart */}
        <div
          className="border p-2.5"
          style={{
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
            transition: 'border-radius 200ms ease',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--heading)' }}>
              Performance
            </span>
            <span
              className="text-[9px]"
              style={{ color: 'var(--muted-foreground, #00110B)', opacity: 0.7 }}
            >
              Last 7 days
            </span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {perfBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  backgroundColor: i % 2 ? 'var(--accent)' : 'var(--primary)',
                  transition: 'background-color 200ms ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Button + chip row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            className="text-[11px] font-semibold px-3 py-1.5 cursor-default"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius)',
              transition: 'background-color 200ms ease, border-radius 200ms ease',
            }}
          >
            + Add Student
          </button>
          <span
            className="text-[10px] font-medium rounded-full"
            style={{
              padding: '2px 8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
              transition: 'background-color 200ms ease',
            }}
          >
            12 pending
          </span>
        </div>
      </div>
    </div>
  )
}
