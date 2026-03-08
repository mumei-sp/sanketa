import { cn } from '@/lib/utils'
import type { AttendanceRecordType } from '../types'
import type { AttendanceStatistics } from '../utils/attendance-stats'
import { AttendanceTrendIcon } from './AttendanceTrendIcon'
import { baseColors, colors, withOpacity } from '@/theme/colors'

interface AttendanceSummaryCardProps {
  type: AttendanceRecordType
  statistics: AttendanceStatistics
  isMobile?: boolean
}

/**
 * Get card configuration based on type
 */
function getCardConfig(type: AttendanceRecordType) {
  switch (type) {
    case 'student':
      return {
        title: 'Students',
        backgroundColor: baseColors.pink,
        textColor: 'text-foreground',
        patternColor: withOpacity(colors.primary.base, 0.3),
      }
    case 'teacher':
      return {
        title: 'Teachers',
        backgroundColor: baseColors.blue,
        textColor: 'text-foreground',
        patternColor: withOpacity(colors.accent.base, 0.3),
      }
    case 'staff':
      return {
        title: 'Staff',
        backgroundColor: baseColors.heading,
        textColor: 'text-white',
        patternColor: withOpacity(colors.background.card, 0.1),
      }
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`
}

/**
 * Colored section with title, total present, and percentage badge
 */
function ColoredSection({
  config,
  statistics,
  isDark,
  clipPathId,
  isMobile,
}: {
  config: ReturnType<typeof getCardConfig>
  statistics: AttendanceStatistics
  isDark: boolean
  clipPathId: string
  isMobile: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col',
        isDark ? 'text-white' : 'text-foreground',
        isMobile ? 'p-3.5 rounded-xl justify-center h-full' : 'p-4 pb-6 flex-[2.5] -mb-3 min-h-0',
      )}
      style={{
        backgroundColor: config.backgroundColor,
        ...(!isMobile
          ? { clipPath: `url(#${clipPathId})`, WebkitClipPath: `url(#${clipPathId})` }
          : {}),
        overflow: 'hidden',
      }}
    >
      {/* Decorative pattern */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.patternColor} 0%, transparent 70%)`,
          transform: 'translate(20%, -20%)',
        }}
      />

      <h3 className={cn('text-section-title mb-1 relative z-10', config.textColor)}>
        {config.title}
      </h3>

      <div className="flex items-baseline gap-2 mb-1 relative z-10">
        <span
          className={cn(
            'text-numeric text-2xl',
            isDark ? 'text-white' : 'text-foreground',
          )}
        >
          {formatNumber(statistics.totalPresent)}
        </span>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-md"
          style={{ backgroundColor: colors.status.success.base, color: 'white' }}
        >
          <AttendanceTrendIcon size={10} />
          <span className="text-badge" style={{ color: 'white' }}>
            {formatPercentage(statistics.attendancePercentage)}
          </span>
        </div>
      </div>

      <p
        className={cn(
          'text-body-muted relative z-10',
          isDark ? 'text-white/80' : 'text-muted-foreground',
        )}
      >
        Total Present
      </p>
    </div>
  )
}

/**
 * Breakdown stats section (On-Time, Late, Absent)
 */
function BreakdownSection({
  statistics,
  isMobile,
}: {
  statistics: AttendanceStatistics
  isMobile: boolean
}) {
  const items = [
    { label: 'On-Time', value: statistics.onTime, pct: statistics.onTimePercentage },
    { label: 'Late', value: statistics.late, pct: statistics.latePercentage },
    { label: 'Absent', value: statistics.absent, pct: statistics.absentPercentage },
  ]

  if (isMobile) {
    // Mobile: vertical list on the right side
    return (
      <div className="flex flex-col gap-3 justify-center py-3 px-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <span className="text-body text-muted-foreground whitespace-nowrap">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-numeric font-semibold text-foreground">{formatNumber(item.value)}</span>
              <span
                className="text-badge px-1.5 py-0.5 rounded"
                style={{ backgroundColor: colors.accent.muted, color: colors.text.muted }}
              >
                {formatPercentage(item.pct)}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Desktop/Tablet: horizontal row
  return (
    <div
      className="p-4 pt-8 flex-1 flex flex-col min-h-0 rounded-b-lg"
      style={{ backgroundColor: colors.background.card }}
    >
      <div className="flex gap-4 -mt-6">
        {items.map(item => (
          <div key={item.label} className="flex flex-col gap-1 flex-1 items-center">
            <span className="text-body text-foreground">{item.label}</span>
            <span className="text-numeric text-foreground text-center">
              {formatNumber(item.value)}
            </span>
            <span
              className="text-badge px-2 py-0.5 rounded w-fit"
              style={{ backgroundColor: colors.accent.muted, color: colors.text.muted }}
            >
              {formatPercentage(item.pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Attendance Summary Card Component
 */
export function AttendanceSummaryCard({
  type,
  statistics,
  isMobile = false,
}: AttendanceSummaryCardProps) {
  const config = getCardConfig(type)
  const isDark = type === 'staff'
  const clipPathId = `attendance-card-clip-${type}`

  if (isMobile) {
    // Mobile: horizontal card with colored left (inset) + breakdown right
    return (
      <div className="flex items-stretch rounded-xl shadow-xs bg-card p-2.5 gap-2">
        <div className="w-[38%] shrink-0">
          <ColoredSection
            config={config}
            statistics={statistics}
            isDark={isDark}
            clipPathId={clipPathId}
            isMobile={true}
          />
        </div>
        <div className="flex-1 min-w-0">
          <BreakdownSection statistics={statistics} isMobile={true} />
        </div>
      </div>
    )
  }

  // Desktop/Tablet: vertical card with colored top + white bottom
  return (
    <div className="relative h-full flex flex-col rounded-lg shadow-xs overflow-hidden bg-card">
      {/* SVG definition for clip-path */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <path d="M 0,0.07 Q 0,0 0.035,0 L 0.965,0 Q 1,0 1,0.07 L 1,0.80 C 1,0.90 0,0.90 0,0.80 Z" />
          </clipPath>
        </defs>
      </svg>

      <ColoredSection
        config={config}
        statistics={statistics}
        isDark={isDark}
        clipPathId={clipPathId}
        isMobile={false}
      />
      <BreakdownSection statistics={statistics} isMobile={false} />
    </div>
  )
}
