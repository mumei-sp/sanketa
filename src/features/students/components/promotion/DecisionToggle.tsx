/**
 * DecisionToggle — Promotion decision toggle buttons.
 *
 * Renders Promote / Retain / Transfer pill buttons.
 * Shared by PromotionTable (layout="table") and PromotionCards (layout="card").
 */

import { colors } from '@/theme/colors'
import { DECISION_OPTIONS } from '../../constants/promotion'
import type { PromotionDecision } from '../../types/promotion'

interface DecisionToggleProps {
  currentValue: PromotionDecision
  onSelect: (value: PromotionDecision) => void
  /** 'table' → compact py-1; 'card' → full-width py-1.5 */
  layout?: 'table' | 'card'
}

export function DecisionToggle({ currentValue, onSelect, layout = 'table' }: DecisionToggleProps) {
  return (
    <div className="flex items-center gap-1.5">
      {DECISION_OPTIONS.map(opt => {
        const isActive = currentValue === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 cursor-pointer transition-all ${
              layout === 'card' ? 'flex-1 justify-center py-1.5' : 'py-1'
            }`}
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
  )
}
