/**
 * GradeSummaryBar — Sticky bottom bar showing live grade summary and save/submit actions.
 *
 * Mirrors the AttendanceDailySummaryBar pattern.
 */

import { Check, X, AlertCircle, BarChart3 } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import type { GradeEntry } from '../types'

interface GradeSummaryBarProps {
  entries: GradeEntry[]
  isSaving: boolean
  onSaveDraft: () => void
  onSubmit: () => void
}

export function GradeSummaryBar({
  entries,
  isSaving,
  onSaveDraft,
  onSubmit,
}: GradeSummaryBarProps) {
  const { calculateGrade } = useGradeCalculator()

  const totalStudents = entries.length
  const entered = entries.filter(e => e.marksObtained !== null).length
  const allEntered = entered === totalStudents && totalStudents > 0

  // Calculate pass/fail/average from entered marks
  let passCount = 0
  let failCount = 0
  let totalPct = 0

  entries.forEach(e => {
    if (e.marksObtained !== null) {
      const result = calculateGrade(e.marksObtained, e.maxMarks)
      if (result.isPassing) passCount++
      else failCount++
      totalPct += result.percentage
    }
  })

  const average = entered > 0 ? Math.round((totalPct / entered) * 10) / 10 : 0

  const stats = [
    { label: 'Entered', value: `${entered}/${totalStudents}`, icon: AlertCircle, color: colors.text.muted },
    { label: 'Average', value: `${average}%`, icon: BarChart3, color: 'color-mix(in srgb, var(--accent) 85%, black)' },
    { label: 'Pass', value: String(passCount), icon: Check, color: colors.status.success.text },
    { label: 'Fail', value: String(failCount), icon: X, color: colors.status.danger.text },
  ]

  return (
    <div
      className="sticky bottom-0 z-10 border-t flex items-center justify-between flex-wrap gap-3 border-border-default shadow-sm"
      style={{
        padding: `${spacing['3']} ${spacing['4']}`,
        backgroundColor: colors.background.card,
      }}
    >
      {/* Summary counts */}
      <div className="flex items-center gap-4 flex-wrap">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="text-text-muted">{s.label}:</span>
            <span className="font-semibold text-text-heading">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={entered === 0 || isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity border"
          style={{
            borderColor: colors.border.default,
            backgroundColor: colors.background.card,
            color: 'var(--heading)',
            opacity: entered === 0 || isSaving ? 0.5 : 1,
            cursor: entered === 0 || isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allEntered || isSaving}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
          style={{
            backgroundColor: allEntered ? 'var(--heading)' : colors.border.default,
            color: colors.background.card,
            opacity: !allEntered || isSaving ? 0.6 : 1,
            cursor: !allEntered || isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? 'Submitting...' : 'Submit Grades'}
        </button>
      </div>
    </div>
  )
}
