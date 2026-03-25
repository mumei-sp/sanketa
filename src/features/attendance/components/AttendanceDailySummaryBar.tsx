import { Check, Clock, X, AlertCircle } from 'lucide-react'
import { colors, darken, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { MarkableAttendanceStatus } from '../types'

interface AttendanceDailySummaryBarProps {
  /** Map of studentId → status (undefined means unmarked) */
  entries: Record<string, MarkableAttendanceStatus | undefined>
  /** Total students in roster */
  totalStudents: number
  /** Whether save is in progress */
  isSaving: boolean
  /** Called when user clicks Save */
  onSave: () => void
  /** Whether all students have been marked */
  allMarked: boolean
}

/**
 * Sticky bottom bar showing live attendance summary counts
 * and a Save/Submit button.
 */
export function AttendanceDailySummaryBar({
  entries,
  totalStudents,
  isSaving,
  onSave,
  allMarked,
}: AttendanceDailySummaryBarProps) {
  const counts = { present: 0, late: 0, absent: 0, unmarked: 0 }

  Object.values(entries).forEach(status => {
    if (status === 'present') counts.present++
    else if (status === 'late') counts.late++
    else if (status === 'absent') counts.absent++
    else counts.unmarked++
  })

  // If fewer entries than roster, remainder is unmarked
  counts.unmarked += totalStudents - Object.keys(entries).length

  const stats = [
    { label: 'Present', count: counts.present, icon: Check, color: darken(baseColors.blue, 15) },
    { label: 'Late', count: counts.late, icon: Clock, color: darken(baseColors.pink, 20) },
    { label: 'Absent', count: counts.absent, icon: X, color: colors.text.heading },
    { label: 'Unmarked', count: counts.unmarked, icon: AlertCircle, color: colors.text.muted },
  ]

  return (
    <div
      className="sticky bottom-0 z-10 border-t flex items-center justify-between flex-wrap gap-3 bg-bg-card border-border-default"
      style={{ padding: `${spacing['3']} ${spacing['4']}` }}
    >
      {/* Summary counts */}
      <div className="flex items-center gap-4 flex-wrap">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="text-text-muted">{s.label}:</span>
            <span className="font-semibold text-text-heading">
              {s.count}
            </span>
          </div>
        ))}
        <div className="text-xs text-text-muted">
          {totalStudents - counts.unmarked}/{totalStudents} marked
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        disabled={!allMarked || isSaving}
        className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: allMarked ? colors.text.heading : colors.border.default,
          color: colors.background.card,
          opacity: !allMarked || isSaving ? 0.6 : 1,
          cursor: !allMarked || isSaving ? 'not-allowed' : 'pointer',
        }}
      >
        {isSaving ? 'Saving...' : 'Save Attendance'}
      </button>
    </div>
  )
}
