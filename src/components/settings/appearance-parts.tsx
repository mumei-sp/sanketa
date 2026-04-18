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
import { Sun, Moon, Monitor } from 'lucide-react'
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
      className="relative grid rounded-full p-1 border"
      style={{
        gridTemplateColumns: `repeat(${MODE_ITEMS.length}, minmax(0, 1fr))`,
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        width: 'fit-content',
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
            className="relative z-10 flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold cursor-pointer transition-colors"
            style={{
              color: active ? 'var(--heading)' : 'var(--muted-foreground)',
              minWidth: '96px',
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
      className="group relative flex flex-col rounded-xl overflow-hidden border text-left transition-all cursor-pointer"
      style={{
        borderColor: active ? preset.heading : 'var(--border)',
        boxShadow: active ? `0 0 0 1px ${preset.heading}` : 'none',
        backgroundColor: 'var(--card)',
      }}
    >
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
