/**
 * GradeEntryCards — Mobile card layout for entering student marks.
 *
 * Each card shows student avatar, name, roll number, marks input,
 * auto-calculated grade badge, and remarks.
 */

import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { MobileCardItem } from '@/components/shared/MobileCardItem'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import type { GradeEntry } from '../types'

interface GradeEntryCardsProps {
  entries: GradeEntry[]
  onMarksChange: (studentId: string, marks: number | null) => void
  onRemarksChange: (studentId: string, remarks: string) => void
  disabled?: boolean
}

export function GradeEntryCards({
  entries,
  onMarksChange,
  onRemarksChange,
  disabled = false,
}: GradeEntryCardsProps) {
  const { calculateGrade } = useGradeCalculator()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      {entries.map(entry => {
        const grade = entry.marksObtained !== null
          ? calculateGrade(entry.marksObtained, entry.maxMarks)
          : null

        return (
          <MobileCardItem key={entry.studentId}>
            {/* Top row: avatar + name + roll */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <StudentAvatar name={entry.studentName} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-heading truncate">{entry.studentName}</div>
                <div className="text-xs text-text-muted">Roll #{entry.rollNumber}</div>
              </div>
              {grade && (
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0"
                  style={{
                    backgroundColor: grade.isPassing ? colors.accent.base : colors.status.danger.soft,
                    color: grade.isPassing ? colors.text.heading : colors.status.danger.text,
                  }}
                >
                  {grade.label} ({grade.percentage}%)
                </span>
              )}
            </div>

            {/* Bottom row: marks input + remarks */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={entry.marksObtained ?? ''}
                  onChange={e => {
                    const val = e.target.value
                    onMarksChange(entry.studentId, val === '' ? null : Math.min(entry.maxMarks, Math.max(0, parseInt(val) || 0)))
                  }}
                  min={0}
                  max={entry.maxMarks}
                  disabled={disabled}
                  placeholder="—"
                  className="w-[60px] text-sm rounded-md border px-2 py-1.5 outline-none text-center border-border-default text-text-heading bg-bg-card"
                />
                <span className="text-xs text-text-muted">/ {entry.maxMarks}</span>
              </div>
              <input
                type="text"
                value={entry.remarks}
                onChange={e => onRemarksChange(entry.studentId, e.target.value)}
                placeholder="Remarks..."
                disabled={disabled}
                className="flex-1 min-w-0 text-sm rounded-md border px-2 py-1.5 outline-none border-border-default text-text-body bg-bg-card"
              />
            </div>
          </MobileCardItem>
        )
      })}
    </div>
  )
}
