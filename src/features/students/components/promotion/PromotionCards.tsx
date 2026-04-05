/**
 * PromotionCards — Mobile card layout for student promotion decisions.
 *
 * Each card shows student avatar, name, roll number, percentage, GPA,
 * performance badge, and decision toggle buttons (Promote / Retain / Transfer).
 */

import { ArrowUp, X, ArrowRight } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { PromotionCandidate, PromotionDecision } from '../../types/promotion'

interface PromotionCardsProps {
  candidates: PromotionCandidate[]
  onDecisionChange: (studentId: string, decision: PromotionDecision) => void
}

const DECISION_OPTIONS: { value: PromotionDecision; label: string; icon: React.ElementType; activeColor: string }[] = [
  { value: 'promote', label: 'Promote', icon: ArrowUp, activeColor: colors.status.success.base },
  { value: 'retain', label: 'Retain', icon: X, activeColor: colors.status.danger.base },
  { value: 'transfer', label: 'Transfer', icon: ArrowRight, activeColor: colors.text.heading },
]

const PERFORMANCE_STYLES: Record<string, { bg: string; color: string }> = {
  Good: { bg: colors.status.success.soft, color: colors.status.success.text },
  'Needs Support': { bg: colors.status.warning.soft, color: colors.status.warning.text },
  'At Risk': { bg: colors.status.danger.soft, color: colors.status.danger.text },
}

export function PromotionCards({ candidates, onDecisionChange }: PromotionCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      {candidates.map(candidate => {
        const perfStyle = PERFORMANCE_STYLES[candidate.performance] || PERFORMANCE_STYLES.Good

        return (
          <div
            key={candidate.studentId}
            className="rounded-lg border"
            style={{
              padding: spacing['3'],
              borderColor: colors.border.default,
              backgroundColor: colors.background.card,
            }}
          >
            {/* Top row: avatar + name/roll on left, percentage + GPA on right */}
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden"
                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', backgroundColor: colors.accent.base, color: colors.text.heading }}
              >
                {candidate.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-heading truncate">{candidate.studentName}</div>
                <div className="text-xs text-text-muted">Roll #{candidate.rollNumber}</div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: colors.text.heading, fontVariantNumeric: 'tabular-nums' }}>
                  {candidate.percentage}%
                </span>
                <span className="text-xs font-medium" style={{ color: colors.text.heading, fontVariantNumeric: 'tabular-nums' }}>
                  GPA {candidate.gpa}
                </span>
              </div>
            </div>

            {/* Performance badge */}
            <div className="mb-2.5">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: perfStyle.bg, color: perfStyle.color }}
              >
                {candidate.performance}
              </span>
            </div>

            {/* Decision buttons row */}
            <div className="flex items-center gap-1.5">
              {DECISION_OPTIONS.map(opt => {
                const isActive = candidate.decision === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onDecisionChange(candidate.studentId, opt.value)}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor: isActive ? opt.activeColor : 'transparent',
                      color: isActive ? '#fff' : colors.text.muted,
                      border: isActive ? 'none' : `1px solid ${colors.border.default}`,
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
