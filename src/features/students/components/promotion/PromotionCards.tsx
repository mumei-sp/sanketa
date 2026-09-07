/**
 * PromotionCards — Mobile card layout for student promotion decisions.
 *
 * Each card shows student avatar, name, roll number, percentage, GPA,
 * performance badge, and decision toggle buttons (Promote / Retain / Transfer).
 */

import { spacing } from '@/config/spacing'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { MobileCardItem } from '@/components/shared/MobileCardItem'
import { PerformanceBadge } from '../PerformanceBadge'
import { DecisionToggle } from './DecisionToggle'
import type { PromotionCandidate, PromotionDecision } from '../../types/promotion'
import type { StudentPerformance } from '../../types'

interface PromotionCardsProps {
  candidates: PromotionCandidate[]
  onDecisionChange: (studentId: string, decision: PromotionDecision) => void
}

export function PromotionCards({ candidates, onDecisionChange }: PromotionCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      {candidates.map(candidate => (
        <MobileCardItem key={candidate.studentId}>
          {/* Top row: avatar + name/roll on left, percentage + GPA on right */}
          <div className="flex items-center gap-2.5 mb-2">
            <StudentAvatar name={candidate.studentName} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-heading truncate">{candidate.studentName}</div>
              <div className="text-xs text-text-muted">Roll #{candidate.rollNumber}</div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-sm font-semibold" style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}>
                {candidate.percentage}%
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}>
                GPA {candidate.gpa}
              </span>
            </div>
          </div>

          {/* Performance badge */}
          <div className="mb-2.5">
            <PerformanceBadge
              performance={candidate.performance as StudentPerformance}
              variant="compact"
            />
          </div>

          {/* Decision buttons row */}
          <DecisionToggle
            currentValue={candidate.decision}
            onSelect={v => onDecisionChange(candidate.studentId, v)}
            layout="card"
          />
        </MobileCardItem>
      ))}
    </div>
  )
}
