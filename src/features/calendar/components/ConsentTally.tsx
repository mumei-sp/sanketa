/**
 * Who has answered, for the people running the trip.
 *
 * The other end of the family dashboard's consent slip. A parent answers yes or
 * no for their child; this is where the school reads the list before the coach
 * leaves.
 *
 * ── Why the children nobody has heard from come first ─────────────────
 * A consent list is not a score. Thirty yeses tell you nothing you have to act
 * on, and the one family that has not answered is the entire reason anybody
 * opens it — so the count leads with them and the rows are ordered to put them
 * at the top. "No answer yet" is a row rather than an absence for the same
 * reason: a child missing from the list is a child nobody chases.
 *
 * ── It shows only the events that ask ─────────────────────────────────
 * Rendered from `needsConsent` events alone, and absent when there are none.
 * A calendar is mostly occasions nobody has to agree to.
 */

import * as React from 'react'
import { Check, X, Clock } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { text, border, statusVivid } from '@/theme/colors'
import { formatDateForDisplay } from '@/utils/date'
import { fetchCalendarEvents } from '@/api/services/calendar-service'
import { fetchConsentTally, type ConsentTallyRow } from '@/api/services/consent-service'
import type { CalendarEvent } from '@/features/calendar/types'

interface Asked {
  event: CalendarEvent
  rows: ConsentTallyRow[]
}

function Answer({ row }: { row: ConsentTallyRow }) {
  if (row.answer === null) {
    return (
      <span className="flex items-center gap-1.5 text-caption" style={{ color: text.muted }}>
        <Clock className="size-3.5" />
        No answer yet
      </span>
    )
  }
  const tone = row.answer === 'given' ? statusVivid.success : statusVivid.danger
  const Icon = row.answer === 'given' ? Check : X
  return (
    <span className="flex items-center gap-1.5 text-caption" style={{ color: tone.color }}>
      <Icon className="size-3.5" />
      {row.answer === 'given' ? 'Yes' : 'No'}
      {row.answeredByName ? ` · ${row.answeredByName}` : ''}
    </span>
  )
}

export function ConsentTally() {
  const [asked, setAsked] = React.useState<Asked[] | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const events = await fetchCalendarEvents()
        const asking = events.filter(event => event.extendedProps.needsConsent === true)
        const withRows = await Promise.all(
          asking.map(async event => ({
            event,
            rows: await fetchConsentTally(event.id),
          })),
        )
        if (!cancelled) setAsked(withRows.filter(entry => entry.rows.length > 0))
      } catch (error) {
        console.error('Failed to load consent responses', error)
        if (!cancelled) setAsked([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (asked === null) return <Skeleton className="h-[120px] w-full rounded-xl" />
  if (asked.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {asked.map(({ event, rows }) => {
        const waiting = rows.filter(row => row.answer === null).length
        const no = rows.filter(row => row.answer === 'declined').length
        // Unanswered first — they are the only rows anybody has to act on.
        const ordered = [...rows].sort((a, b) => {
          const rank = (row: ConsentTallyRow) =>
            row.answer === null ? 0 : row.answer === 'declined' ? 1 : 2
          return rank(a) - rank(b) || a.studentName.localeCompare(b.studentName)
        })

        return (
          <SectionCard
            key={event.id}
            title={event.title}
            action={
              <span className="text-caption" style={{ color: text.muted }}>
                {waiting > 0 ? `${waiting} still to answer` : 'Everyone has answered'}
                {no > 0 ? ` · ${no} not coming` : ''}
              </span>
            }
          >
            <div className="flex flex-col">
              <span className="pb-2 text-caption" style={{ color: text.muted }}>
                {formatDateForDisplay(String(event.start))}
                {event.extendedProps.consentBy
                  ? ` · answers wanted by ${formatDateForDisplay(event.extendedProps.consentBy)}`
                  : ''}
              </span>
              {/* Capped and scrolling, not as long as the guest list. A trip for
                  two grades is a hundred children, and an admin sees all of
                  them — unbounded, this card alone was taller than the calendar
                  it sits above. `.tile-list` is the shared cap. */}
              <div className="tile-list scrollbar-thin flex flex-col">
                {ordered.map((row, index) => (
                  <div
                    key={row.studentId}
                    className="flex items-center justify-between gap-3 py-2 pr-1"
                    style={index > 0 ? { borderTop: `1px solid ${border.default}` } : undefined}
                  >
                    <span className="truncate text-body" style={{ color: 'var(--heading)' }}>
                      {row.studentName}
                    </span>
                    <Answer row={row} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )
      })}
    </div>
  )
}
