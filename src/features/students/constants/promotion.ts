/**
 * Promotion Feature Constants
 *
 * Single source of truth for promotion decision options.
 * Used by PromotionTable, PromotionCards, PromotionSummaryBar, and DecisionToggle.
 */

import { ArrowUp, X, ArrowRight } from 'lucide-react'
import { colors } from '@/theme/colors'
import type { PromotionDecision } from '../types/promotion'

export const DECISION_OPTIONS: {
  value: PromotionDecision
  label: string
  icon: React.ElementType
  activeColor: string
}[] = [
  { value: 'promote', label: 'Promote', icon: ArrowUp, activeColor: colors.status.success.base },
  { value: 'retain', label: 'Retain', icon: X, activeColor: colors.status.danger.base },
  { value: 'transfer', label: 'Transfer', icon: ArrowRight, activeColor: 'var(--heading)' },
]
