/**
 * ActivityTab — what changed, who changed it, and when.
 *
 * The half of an access-control screen that is easy to leave out and hard to
 * add later. Without it the answer to "why can the office assistant see
 * salaries?" is a shrug: the switch that did it left no trace, and the person
 * who flipped it may not remember. With it, every grant has an author.
 *
 * Read-only by design, and not merely because there is nothing to edit — a log
 * whose entries can be corrected by the people it records answers nothing. The
 * store offers no update and no delete for the same reason.
 *
 * Grouped by day rather than paged. An audit trail is read backwards from now
 * ("what happened this week?"), not searched from the beginning, and a date
 * heading answers that faster than a timestamp on every row.
 */

import * as React from 'react'
import {
  ShieldPlus,
  ShieldX,
  ShieldCheck,
  UserCog,
  UserPlus,
  Layers,
  History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { border, text } from '@/theme/colors'
import { getInitials } from '@/utils/format'
import {
  formatRelativeTime,
  formatAbsoluteTime,
} from '@/features/notifications/utils/notification-display'
import type { AccessEvent, AccessEventKind } from '@/api/services/access-log-service'
import { SearchField } from './parts'

const ICONS: Record<AccessEventKind, LucideIcon> = {
  'role.create': ShieldPlus,
  'role.update': ShieldCheck,
  'role.delete': ShieldX,
  'user.role': UserCog,
  'user.classes': Layers,
  'user.create': UserPlus,
}

/** Today / Yesterday / a date — the heading a row sits under. */
function dayHeading(iso: string, now: Date): string {
  const when = new Date(iso)
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = 24 * 60 * 60 * 1000

  if (when.getTime() >= midnight) return 'Today'
  if (when.getTime() >= midnight - day) return 'Yesterday'
  return when.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Split a detail string into its own chips.
 *
 * Written by the writer as "+ Manage finance, − View transport" so the store
 * holds one readable field rather than a shape only this component
 * understands. Splitting it back out is the view's business.
 */
function detailParts(detail: string): string[] {
  return detail
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

export function ActivityTab({ events }: { events: AccessEvent[] | null }) {
  const [query, setQuery] = React.useState('')
  // One `now` for the whole render, so two rows a millisecond apart cannot
  // land under different headings.
  const now = React.useMemo(() => new Date(), [events])

  if (events === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map(row => (
          <Skeleton key={row} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const needle = query.trim().toLowerCase()
  const visible = events.filter(event => {
    if (!needle) return true
    return (
      event.summary.toLowerCase().includes(needle) ||
      event.target.toLowerCase().includes(needle) ||
      event.actorName.toLowerCase().includes(needle) ||
      (event.detail?.toLowerCase().includes(needle) ?? false)
    )
  })

  // Days in the order the events arrive, which is already newest first.
  const days: { heading: string; events: AccessEvent[] }[] = []
  visible.forEach(event => {
    const heading = dayHeading(event.at, now)
    const last = days[days.length - 1]
    if (last && last.heading === heading) last.events.push(event)
    else days.push({ heading, events: [event] })
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-muted text-muted-foreground">
        Every change to roles and to who holds them. Newest first, and nobody can edit it.
      </p>

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search the log…"
        label="Search the access log"
      />

      {visible.length === 0 && (
        <div
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center"
          style={{ borderColor: border.default }}
        >
          <History className="size-6" style={{ color: text.muted }} aria-hidden />
          <p className="text-body font-medium" style={{ color: 'var(--heading)' }}>
            {events.length === 0 ? 'Nothing has changed yet' : 'No entry matches that'}
          </p>
          <p className="text-caption text-muted-foreground">
            {events.length === 0
              ? 'Role and access changes will appear here as they are made.'
              : 'Try a person, a role, or a permission name.'}
          </p>
        </div>
      )}

      {days.map(day => (
        <div key={day.heading} className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {day.heading}
          </p>

          {/* The rail is the border on the list, not a line per row: one
              element that cannot drift out of alignment as rows grow. */}
          <div
            className="flex flex-col gap-3 border-l pl-4"
            style={{ borderColor: border.default }}
          >
            {day.events.map(event => {
              const Icon = ICONS[event.kind] ?? ShieldCheck
              return (
                <div key={event.id} className="relative flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="absolute -left-[25px] top-1 flex size-4 items-center justify-center rounded-full ring-4"
                    style={{
                      backgroundColor: 'var(--heading)',
                      // Punches the rail out behind the dot so the line reads
                      // as passing behind it rather than into it.
                      ['--tw-ring-color' as string]: 'var(--card)',
                    }}
                  >
                    <Icon className="size-2.5" style={{ color: 'var(--card)' }} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-body" style={{ color: 'var(--heading)' }}>
                      {event.summary}
                    </p>

                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                      <span
                        aria-hidden
                        className="flex size-4 items-center justify-center rounded-full text-[8px] font-bold"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--heading)' }}
                      >
                        {getInitials(event.actorName)}
                      </span>
                      {event.actorName}
                      <span aria-hidden>·</span>
                      <time dateTime={event.at} title={formatAbsoluteTime(event.at)}>
                        {formatRelativeTime(event.at)}
                      </time>
                    </p>

                    {event.detail && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {detailParts(event.detail).map((part, index) => {
                          const removed = part.startsWith('−') || part.startsWith('-')
                          return (
                            <span
                              key={`${part}-${index}`}
                              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: 'var(--muted)',
                                color: removed ? 'var(--destructive)' : 'var(--heading)',
                              }}
                            >
                              {part}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
