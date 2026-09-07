import * as React from 'react'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border, background } from '@/theme/colors'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import type { PerformanceMetric } from '../types/teacher-detail'

/** "This Year" now means the academic year, dynamically labeled */
/** @internal Available period labels for performance filtering */
export const PERIODS = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year']

interface TeacherPerformanceProps {
  metrics: PerformanceMetric[]
  performanceByPeriod?: Record<string, PerformanceMetric[]>
}

/**
 * TeacherPerformance - Displays performance metrics in individual cards
 * with pink progress bars and a navy marker indicator.
 */
export function TeacherPerformance({ metrics, performanceByPeriod }: TeacherPerformanceProps) {
  const { academicYear } = useAcademicDates()

  // Dynamic periods — "This Year" shows the academic year label
  const periods = React.useMemo(() => [
    'Last Month', 'Last 3 Months', 'Last 6 Months', `This Year (${academicYear.label})`,
  ], [academicYear.label])

  const [selectedPeriod, setSelectedPeriod] = React.useState(periods[0])
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Use period data if available, otherwise fall back to metrics prop
  const activeMetrics = performanceByPeriod?.[selectedPeriod] ?? metrics

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

  if (!activeMetrics.length) return null

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
        {selectedPeriod}
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
          {periods.map(period => (
            <button
              key={period}
              onClick={() => { setSelectedPeriod(period); setIsOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing['2']} ${spacing['3']}`,
                fontSize: fontSizes.xs,
                fontWeight: period === selectedPeriod ? 600 : 400,
                color: period === selectedPeriod ? 'var(--heading)' : text.body,
                backgroundColor: period === selectedPeriod ? 'var(--accent)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {period}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <SectionCard
      title="Performance"
      action={dropdownButton}
      style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'], maxHeight: '320px', overflowY: 'auto' }}>
        {activeMetrics.map(metric => {
          const percentage = (metric.value / metric.max) * 100

          return (
            <div
              key={metric.label}
              style={{
                backgroundColor: background.card,
                borderRadius: spacing['3'],
                padding: `${spacing['3']} ${spacing['4']}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing['2'],
              }}
            >
              {/* Label + score row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: fontSizes.sm, fontWeight: 600, color: 'var(--heading)' }}>
                  {metric.label}
                </span>
                <span style={{ fontSize: fontSizes.sm, fontWeight: 700, color: 'var(--heading)' }}>
                  {metric.value}%<span style={{ fontWeight: 400, color: text.body }}>/{metric.max}%</span>
                </span>
              </div>

              {/* Rating + progress bar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                <span
                  style={{
                    fontSize: fontSizes.xs,
                    color: text.body,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                  }}
                >
                  {metric.rating}
                </span>
                <div
                  style={{
                    position: 'relative',
                    width: '55%',
                    marginLeft: 'auto',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: border.default,
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      borderRadius: '3px',
                      backgroundColor: 'var(--primary)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                  {/* Navy marker at the end of the bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: `${percentage}%`,
                      transform: 'translateX(-50%)',
                      width: '3px',
                      height: '10px',
                      borderRadius: '1.5px',
                      backgroundColor: 'var(--heading)',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
