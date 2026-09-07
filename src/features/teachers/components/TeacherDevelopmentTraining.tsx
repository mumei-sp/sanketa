import * as React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border, status, background } from '@/theme/colors'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import type { TrainingEvent } from '../types/teacher-detail'

type SortKey = 'event' | 'date' | 'location' | 'status'
type SortDir = 'asc' | 'desc'

/** Parse "Mon DD, YYYY" date strings for sorting */
function parseDate(dateStr: string): number {
  return new Date(dateStr).getTime()
}

interface TeacherDevelopmentTrainingProps {
  events: TrainingEvent[]
}

const HEADERS: { key: SortKey; label: string }[] = [
  { key: 'event', label: 'Event' },
  { key: 'date', label: 'Date' },
  { key: 'location', label: 'Loc/Platform' },
  { key: 'status', label: 'Status' },
]

export function TeacherDevelopmentTraining({ events }: TeacherDevelopmentTrainingProps) {
  const { terms, getRange } = useAcademicDates()

  // Build dynamic term options from config + "All"
  const termOptions = React.useMemo(() => {
    const currentTermLabel = terms.length > 0 ? `This ${terms[0].label.split(' ')[0]}` : 'This Term'
    const lastTermLabel = terms.length > 0 ? `Last ${terms[0].label.split(' ')[0]}` : 'Last Term'
    return [currentTermLabel, lastTermLabel, 'All']
  }, [terms])

  const [sortKey, setSortKey] = React.useState<SortKey | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>('asc')
  const [semester, setSemester] = React.useState(termOptions[0])
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter by term using academic calendar config
  const filtered = React.useMemo(() => {
    if (semester === 'All') return events

    // Map display label to period key for getRange
    const periodKey = semester.startsWith('This') ? 'this-term' : 'last-term'
    const range = getRange(periodKey)

    return events.filter(e => {
      const ts = parseDate(e.date)
      return ts >= range.startDate.getTime() && ts <= range.endDate.getTime()
    })
  }, [events, semester, getRange])

  // Sort
  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') {
        cmp = parseDate(a.date) - parseDate(b.date)
      } else if (sortKey === 'event') {
        cmp = a.event.localeCompare(b.event)
      } else if (sortKey === 'location') {
        cmp = a.location.localeCompare(b.location)
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  if (!events.length) return null

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const dropdownButton = (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="hover:opacity-90 transition-opacity"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          fontSize: fontSizes.sm,
          padding: `${spacing['2']} ${spacing['4']}`,
          borderRadius: spacing['3'],
          border: 'none',
          backgroundColor: 'var(--accent)',
          color: 'var(--heading)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: spacing['1.5'],
          fontWeight: 500,
        }}
      >
        {semester}
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: spacing['1'],
            backgroundColor: background.card,
            border: `1px solid ${border.default}`,
            borderRadius: spacing['2'],
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: '140px',
            overflow: 'hidden',
          }}
        >
          {termOptions.map(s => (
            <button
              key={s}
              onClick={() => { setSemester(s); setIsOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing['2']} ${spacing['3']}`,
                fontSize: fontSizes.xs,
                fontWeight: s === semester ? 600 : 400,
                color: s === semester ? 'var(--heading)' : text.body,
                backgroundColor: s === semester ? 'var(--accent)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <SectionCard title="Development & Training" action={dropdownButton}>
      <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: fontSizes.xs,
          }}
        >
          <thead>
            <tr>
              {HEADERS.map(header => (
                <th
                  key={header.key}
                  onClick={() => handleSort(header.key)}
                  style={{
                    padding: `${spacing['2']} ${spacing['2']}`,
                    textAlign: 'left',
                    color: text.body,
                    fontWeight: 500,
                    borderBottom: `1px solid ${border.default}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing['1'] }}>
                    {header.label}
                    {sortKey === header.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="w-3 h-3" style={{ color: 'var(--heading)' }} />
                      ) : (
                        <ArrowDown className="w-3 h-3" style={{ color: 'var(--heading)' }} />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3" style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: spacing['4'],
                    textAlign: 'center',
                    color: text.body,
                    fontSize: fontSizes.sm,
                  }}
                >
                  No training events for {semester.toLowerCase()}
                </td>
              </tr>
            ) : (
              sorted.map(event => (
                <tr key={event.id}>
                  <td
                    style={{
                      padding: `${spacing['3']} ${spacing['2']}`,
                      borderBottom: `1px solid ${border.subtle}`,
                      verticalAlign: 'top',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500, color: text.body, margin: 0, fontSize: fontSizes.sm }}>
                        {event.event}
                      </p>
                      <p style={{ margin: 0, fontSize: fontSizes.xs, color: text.body, opacity: 0.6 }}>
                        {event.type}
                      </p>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: `${spacing['3']} ${spacing['2']}`,
                      borderBottom: `1px solid ${border.subtle}`,
                      color: 'var(--heading)',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                      fontSize: fontSizes.sm,
                    }}
                  >
                    {event.date}
                  </td>
                  <td
                    style={{
                      padding: `${spacing['3']} ${spacing['2']}`,
                      borderBottom: `1px solid ${border.subtle}`,
                      color: text.body,
                      verticalAlign: 'top',
                      fontSize: fontSizes.sm,
                      maxWidth: '180px',
                    }}
                  >
                    {event.location}
                  </td>
                  <td
                    style={{
                      padding: `${spacing['3']} ${spacing['2']}`,
                      borderBottom: `1px solid ${border.subtle}`,
                      verticalAlign: 'top',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: `${spacing['0.5']} ${spacing['2.5']}`,
                        borderRadius: '999rem',
                        fontSize: fontSizes.xs,
                        fontWeight: 500,
                        backgroundColor: event.status === 'Upcoming'
                          ? status.info.soft
                          : status.success.soft,
                        color: event.status === 'Upcoming'
                          ? status.info.text
                          : status.success.text,
                      }}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
