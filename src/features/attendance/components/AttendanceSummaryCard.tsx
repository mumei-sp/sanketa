import { cn } from '@/lib/utils'
import { Tile } from '@/components/tile'
import type { AttendanceRecordType } from '../types'
import type { AttendanceStatistics } from '../utils/attendance-stats'
import { AttendanceTrendIcon } from './AttendanceTrendIcon'
import { baseColors, colors, withOpacity } from '@/theme/colors'

interface AttendanceSummaryCardProps {
  type: AttendanceRecordType
  statistics: AttendanceStatistics
}

/**
 * Get card configuration based on type
 */
function getCardConfig(type: AttendanceRecordType) {
  switch (type) {
    case 'student':
      return {
        title: 'Students',
        backgroundColor: baseColors.pink, // #FECCFD
        textColor: 'text-foreground',
        patternColor: withOpacity(colors.primary.base, 0.3),
      }
    case 'teacher':
      return {
        title: 'Teachers',
        backgroundColor: baseColors.blue, // #CDEAF0
        textColor: 'text-foreground',
        patternColor: withOpacity(colors.accent.base, 0.3),
      }
    case 'staff':
      return {
        title: 'Staff',
        backgroundColor: baseColors.heading, // #15446E
        textColor: 'text-white',
        patternColor: withOpacity(colors.background.card, 0.1),
      }
  }
}

/**
 * Format number with thousand separators
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format percentage with one decimal place
 */
function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`
}

/**
 * Attendance Summary Card Component
 */
export function AttendanceSummaryCard({ type, statistics }: AttendanceSummaryCardProps) {
  const config = getCardConfig(type)
  const isDark = type === 'staff'

  // SVG clip-path for smooth curved bottom edge
  // Using fixed viewBox to ensure curve geometry remains consistent regardless of container size
  const clipPathId = `attendance-card-clip-${type}`

  return (
    <Tile
      id={`attendance-summary-card-${type}`}
      layoutMode="flex"
      background="white"
      borderRadius="lg"
      shadowed={true}
      overflow="hidden"
      className="relative h-full"
      style={{ flexDirection: 'column' }}
    >
      {/* SVG definition for clip-path */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* 
              SINGLE continuous cubic Bezier curve for bottom edge
              
              Path description (normalized 0-1 coordinates):
              - M 0,0.07: Start at top-left (with rounded corner offset)
              - Q 0,0 0.035,0: Rounded top-left corner
              - L 0.965,0: Straight line across top
              - Q 1,0 1,0.07: Rounded top-right corner
              - L 1,0.72: Straight line down right edge to curve start
              
              ONE continuous cubic Bezier curve (C command):
              - C 1,0.82 0,0.82 0,0.72
                Start: (1, 0.72) - right edge
                Control 1: (1, 0.82) - directly below start, creates vertical tangent
                Control 2: (0, 0.82) - directly below end, creates vertical tangent
                End: (0, 0.72) - left edge
              
              This creates ONE symmetric curve with:
              - Maximum depth at horizontal center
              - Smooth vertical tangents at both edges (no kinks)
              - Perfect left-right symmetry
              - Single continuous arc (not two curves stitched together)
              
              - Z: Close path
            */}
            <path d="M 0,0.07 Q 0,0 0.035,0 L 0.965,0 Q 1,0 1,0.07 L 1,0.72 C 1,0.82 0,0.82 0,0.72 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Top Half - Colored Background */}
      <div
        className={cn(
          'relative p-4 flex-[2.2] flex flex-col -mb-3 min-h-0',
          isDark ? 'text-white' : 'text-foreground',
        )}
        style={{ 
          backgroundColor: config.backgroundColor,
          clipPath: `url(#${clipPathId})`,
          WebkitClipPath: `url(#${clipPathId})`,
          overflow: 'hidden',
        }}
      >
        {/* Decorative pattern - abstract "S" shape */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${config.patternColor} 0%, transparent 70%)`,
            transform: 'translate(20%, -20%)',
          }}
        />

        {/* Title */}
        <h3 className={cn('text-section-title mb-2 relative z-10', config.textColor)}>
          {config.title}
        </h3>

        {/* Total Present and Percentage Badge */}
        <div className="flex items-baseline gap-2 mb-1 relative z-10">
          <span
            className={cn(
              'text-numeric text-3xl',
              isDark ? 'text-white' : 'text-foreground',
            )}
          >
            {formatNumber(statistics.totalPresent)}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.status.success.base, color: 'white' }}>
            <AttendanceTrendIcon size={10} />
            <span className="text-badge" style={{ color: 'white' }}>{formatPercentage(statistics.attendancePercentage)}</span>
          </div>
        </div>

        {/* Total Present Label */}
        <p className={cn('text-body-muted relative z-10', isDark ? 'text-white/80' : 'text-muted-foreground')}>
          Total Present
        </p>
      </div>

      {/* Bottom Half - White Background */}
      <div className="p-4 pt-8 flex-1 flex flex-col min-h-0 rounded-b-lg" style={{ backgroundColor: colors.background.card }}>
        {/* Breakdown Section */}
        <div className="flex gap-4 -mt-6">
          {/* On-Time */}
          <div className="flex flex-col gap-1 flex-1 items-center">
            <span className="text-body text-foreground">
              On-Time
            </span>
            <span className="text-numeric text-foreground text-center">
              {formatNumber(statistics.onTime)}
            </span>
            <span className="text-badge px-2 py-0.5 rounded w-fit" style={{ backgroundColor: colors.accent.muted, color: colors.text.muted }}>
              {formatPercentage(statistics.onTimePercentage)}
            </span>
          </div>

          {/* Late */}
          <div className="flex flex-col gap-1 flex-1 items-center">
            <span className="text-body text-foreground">
              Late
            </span>
            <span className="text-numeric text-foreground text-center">
              {formatNumber(statistics.late)}
            </span>
            <span className="text-badge px-2 py-0.5 rounded w-fit" style={{ backgroundColor: colors.accent.muted, color: colors.text.muted }}>
              {formatPercentage(statistics.latePercentage)}
            </span>
          </div>

          {/* Absent */}
          <div className="flex flex-col gap-1 flex-1 items-center">
            <span className="text-body text-foreground">
              Absent
            </span>
            <span className="text-numeric text-foreground text-center">
              {formatNumber(statistics.absent)}
            </span>
            <span className="text-badge px-2 py-0.5 rounded w-fit" style={{ backgroundColor: colors.accent.muted, color: colors.text.muted }}>
              {formatPercentage(statistics.absentPercentage)}
            </span>
          </div>
        </div>
      </div>
    </Tile>
  )
}

