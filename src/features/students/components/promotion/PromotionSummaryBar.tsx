/**
 * PromotionSummaryBar — Sticky bottom bar showing promotion decision counts.
 */

import { ArrowUp, X, ArrowRight } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { PromotionCandidate } from '../../types/promotion'

interface PromotionSummaryBarProps {
  candidates: PromotionCandidate[]
  isExecuting: boolean
  onConfirm: () => void
}

export function PromotionSummaryBar({ candidates, isExecuting, onConfirm }: PromotionSummaryBarProps) {
  const promoteCount = candidates.filter(c => c.decision === 'promote').length
  const retainCount = candidates.filter(c => c.decision === 'retain').length
  const transferCount = candidates.filter(c => c.decision === 'transfer').length
  const hasDecisions = candidates.length > 0

  const stats = [
    { label: 'Promote', count: promoteCount, icon: ArrowUp, color: colors.status.success.base },
    { label: 'Retain', count: retainCount, icon: X, color: colors.status.danger.base },
    { label: 'Transfer', count: transferCount, icon: ArrowRight, color: colors.text.heading },
  ]

  return (
    <div
      className="sticky bottom-0 z-10 border-t flex items-center justify-between flex-wrap gap-3 border-border-default shadow-sm"
      style={{
        padding: `${spacing['3']} ${spacing['4']}`,
        backgroundColor: colors.background.card,
      }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="text-text-muted">{s.label}:</span>
            <span className="font-semibold text-text-heading">{s.count}</span>
          </div>
        ))}
        <div className="text-xs text-text-muted">
          {candidates.length} total students
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!hasDecisions || isExecuting}
        className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: hasDecisions ? colors.text.heading : colors.border.default,
          color: colors.background.card,
          opacity: !hasDecisions || isExecuting ? 0.6 : 1,
          cursor: !hasDecisions || isExecuting ? 'not-allowed' : 'pointer',
        }}
      >
        {isExecuting ? 'Processing...' : 'Confirm Promotion'}
      </button>
    </div>
  )
}
