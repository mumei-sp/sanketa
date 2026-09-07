import * as React from 'react'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border, background } from '@/theme/colors'
import type { ScheduleBlock } from '../types/teacher-detail'

const VIEWS = ['Weekly', 'Daily']

interface TeacherScheduleProps {
  schedule: ScheduleBlock[]
  scheduleByView?: Record<string, ScheduleBlock[]>
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

/** Compute visible hour range from schedule data */
function getHourRange(schedule: ScheduleBlock[]): number[] {
  if (!schedule.length) return [8, 9, 10, 11]
  const hours = schedule.map(b => b.hour)
  const min = Math.min(...hours)
  const max = Math.max(...hours)
  // Ensure at least 8 rows for visual balance, pad around actual range
  const rangeStart = Math.min(min, 8)
  const rangeEnd = Math.max(max, rangeStart + 7)
  const result: number[] = []
  for (let h = rangeStart; h <= rangeEnd; h++) result.push(h)
  return result
}

function getBlockStyles(variant: ScheduleBlock['variant']): { backgroundColor: string; color: string } {
  switch (variant) {
    case 'accent':
      return { backgroundColor: 'var(--accent)', color: 'var(--heading)' }
    case 'dark':
      return { backgroundColor: 'var(--heading)', color: background.card }
    case 'primary':
      return { backgroundColor: 'var(--primary)', color: 'var(--heading)' }
  }
}

/**
 * TeacherSchedule - Displays a weekly timetable grid with class blocks
 */
export function TeacherSchedule({ schedule, scheduleByView }: TeacherScheduleProps) {
  const [selectedView, setSelectedView] = React.useState(VIEWS[0])
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Use view data if available, otherwise fall back to schedule prop
  const activeSchedule = scheduleByView?.[selectedView] ?? schedule

  // For Daily view, show only one day column; for Weekly, show all 5
  const days = selectedView === 'Daily'
    ? (() => {
        // Find which day has classes in the daily data
        const daySet = new Set(activeSchedule.map(b => b.day))
        const firstDay = ALL_DAYS.find(d => daySet.has(d)) ?? 'Wed'
        return [firstDay] as typeof ALL_DAYS[number][]
      })()
    : [...ALL_DAYS]

  const visibleHours = getHourRange(activeSchedule)

  // Build a lookup map: `${day}-${hour}` -> ScheduleBlock
  const scheduleMap = new Map<string, ScheduleBlock>()
  activeSchedule.forEach(block => {
    scheduleMap.set(`${block.day}-${block.hour}`, block)
  })

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
        {selectedView}
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
            minWidth: '100px',
            overflow: 'hidden',
          }}
        >
          {VIEWS.map(view => (
            <button
              key={view}
              onClick={() => { setSelectedView(view); setIsOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing['2']} ${spacing['3']}`,
                fontSize: fontSizes.xs,
                fontWeight: view === selectedView ? 600 : 400,
                color: view === selectedView ? 'var(--heading)' : text.body,
                backgroundColor: view === selectedView ? 'var(--accent)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {view}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <SectionCard title="Schedule" action={dropdownButton}>
      <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: fontSizes.xs,
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: `${spacing['2']} ${spacing['2']}`,
                  textAlign: 'left',
                  color: text.body,
                  fontWeight: 500,
                  borderBottom: `1px solid ${border.default}`,
                  width: '60px',
                }}
              >
                Time
              </th>
              {days.map(day => (
                <th
                  key={day}
                  style={{
                    padding: `${spacing['2']} ${spacing['1']}`,
                    textAlign: 'center',
                    color: text.body,
                    fontWeight: 500,
                    borderBottom: `1px solid ${border.default}`,
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleHours.map(hour => (
              <tr key={hour}>
                <td
                  style={{
                    padding: `${spacing['2']} ${spacing['2']}`,
                    color: text.body,
                    fontWeight: 400,
                    borderBottom: `1px solid ${border.subtle}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {String(hour).padStart(2, '0')}:00
                </td>
                {days.map(day => {
                  const block = scheduleMap.get(`${day}-${hour}`)
                  const styles = block ? getBlockStyles(block.variant) : null
                  return (
                    <td
                      key={`${day}-${hour}`}
                      style={{
                        padding: spacing['1'],
                        textAlign: 'center',
                        borderBottom: `1px solid ${border.subtle}`,
                        borderLeft: `1px solid ${border.subtle}`,
                        height: '32px',
                      }}
                    >
                      {block && styles && (
                        <div
                          style={{
                            backgroundColor: styles.backgroundColor,
                            color: styles.color,
                            borderRadius: spacing['1.5'],
                            padding: `${spacing['1.5']} ${spacing['1']}`,
                            fontWeight: 600,
                            fontSize: fontSizes.xs,
                            width: '100%',
                          }}
                        >
                          {block.classCode}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
