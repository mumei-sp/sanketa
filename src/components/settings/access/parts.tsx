/**
 * Small shared pieces of the Access screen.
 *
 * Both halves — roles and people — keep showing the same three things: who
 * holds something, how much of something is granted, and a count worth
 * reading at a glance. They live here so the two tabs stay about their own
 * subject rather than about markup.
 */

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Search, X } from 'lucide-react'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'

/**
 * Overlapping initials, the way a shared document shows its collaborators.
 *
 * A role's members are the fact the old two-screen split hid: the editor could
 * take finance away from Principal without ever mentioning that three people
 * were Principals.
 */
export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length

  if (names.length === 0) {
    return (
      <span className="text-caption" style={{ color: text.muted }}>
        Nobody yet
      </span>
    )
  }

  return (
    <span className="flex items-center">
      {shown.map((name, index) => (
        <span
          key={`${name}-${index}`}
          title={name}
          className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold ring-2"
          style={{
            marginLeft: index === 0 ? 0 : '-6px',
            backgroundColor: 'var(--heading)',
            color: 'var(--card)',
            // The ring separates neighbours without drawing a border that
            // would read as a second circle.
            ['--tw-ring-color' as string]: 'var(--card)',
            zIndex: shown.length - index,
          }}
        >
          {getInitials(name)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold ring-2"
          style={{
            marginLeft: '-6px',
            backgroundColor: 'var(--muted)',
            color: 'var(--heading)',
            ['--tw-ring-color' as string]: 'var(--card)',
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

/** How much of a set is granted. Reads as a fraction, shows as a bar. */
export function CoverageBar({
  value,
  total,
  className,
}: {
  value: number
  total: number
  className?: string
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <span
      className={cn('block h-1 w-full overflow-hidden rounded-full', className)}
      style={{ backgroundColor: 'var(--muted)' }}
      role="img"
      aria-label={`${value} of ${total} permissions granted`}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percent}%`, backgroundColor: 'var(--heading)' }}
      />
    </span>
  )
}

/** One number worth reading at a glance, on the strip above the tabs. */
export function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: React.ReactNode
  label: string
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
      style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <Icon className="size-4" style={{ color: 'var(--heading)' }} />
      </span>
      <span className="min-w-0">
        <span
          className="block text-lg font-semibold leading-none tabular-nums"
          style={{ color: 'var(--heading)' }}
        >
          {value}
        </span>
        <span className="block truncate text-caption" style={{ color: text.muted }}>
          {label}
        </span>
      </span>
    </div>
  )
}

/** A search box that can be cleared without reaching for the keyboard. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
        style={{ color: text.muted }}
      />
      {/* `type="text"`, not `search`: Chrome draws its own clear button for a
          search input, which would sit next to the one below it. */}
      <input
        type="text"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="h-control w-full rounded-lg border bg-transparent pl-8 pr-8 text-body outline-none transition-colors focus:border-[var(--heading)]"
        style={{ borderColor: border.default }}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="size-3.5" style={{ color: text.muted }} />
        </button>
      )}
    </div>
  )
}
