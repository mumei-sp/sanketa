/**
 * PromotionConfirmDialog — Confirmation dialog before executing promotion.
 *
 * Shows summary of decisions, target section selector, and execute button.
 */

import * as React from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { text, border, accent, background, status as statusColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { PromotionCandidate } from '../../types/promotion'

interface PromotionConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceClass: string
  candidates: PromotionCandidate[]
  isExecuting: boolean
  onExecute: (targetSection: string) => void
}

const SECTIONS = ['A', 'B', 'C']

export function PromotionConfirmDialog({
  open,
  onOpenChange,
  sourceClass,
  candidates,
  isExecuting,
  onExecute,
}: PromotionConfirmDialogProps) {
  const [targetSection, setTargetSection] = React.useState('A')

  const sourceGrade = parseInt(sourceClass.replace(/[A-Z]/g, ''))
  const targetGrade = sourceGrade + 1

  const promoted = candidates.filter(c => c.decision === 'promote')
  const retained = candidates.filter(c => c.decision === 'retain')
  const transferred = candidates.filter(c => c.decision === 'transfer')

  return (
    <Dialog open={open} onOpenChange={isExecuting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle style={{ color: text.heading }}>Confirm Promotion</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
          {/* Source → Target */}
          <div
            className="flex items-center justify-center gap-3"
            style={{ padding: spacing['4'], backgroundColor: accent.base, borderRadius: '10px' }}
          >
            <span style={{ fontSize: '20px', fontWeight: 700, color: text.heading }}>
              Class {sourceClass}
            </span>
            <ArrowRight className="w-5 h-5" style={{ color: text.heading }} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: text.heading }}>
              Class {targetGrade}
            </span>
          </div>

          {/* Target section selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: text.heading, display: 'block', marginBottom: spacing['2'] }}>
              Target Section
            </label>
            <div style={{ display: 'flex', gap: spacing['2'] }}>
              {SECTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTargetSection(s)}
                  className="flex-1 text-sm font-medium rounded-lg py-2 cursor-pointer transition-all text-center"
                  style={{
                    border: `2px solid ${targetSection === s ? text.heading : border.default}`,
                    backgroundColor: targetSection === s ? accent.base : 'transparent',
                    color: text.heading,
                  }}
                >
                  {targetGrade}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Decision summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
            {promoted.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: statusColors.success.base, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing['1'] }}>
                  Promoting ({promoted.length})
                </p>
                <p style={{ fontSize: '12px', color: text.muted, lineHeight: 1.5 }}>
                  {promoted.map(c => c.studentName).join(', ')}
                </p>
              </div>
            )}

            {retained.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: statusColors.danger.base, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing['1'] }}>
                  Retaining ({retained.length})
                </p>
                <p style={{ fontSize: '12px', color: text.muted, lineHeight: 1.5 }}>
                  {retained.map(c => c.studentName).join(', ')}
                </p>
              </div>
            )}

            {transferred.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: text.heading, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing['1'] }}>
                  Transferring Out ({transferred.length})
                </p>
                <p style={{ fontSize: '12px', color: text.muted, lineHeight: 1.5 }}>
                  {transferred.map(c => c.studentName).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            Cancel
          </Button>
          <Button
            onClick={() => onExecute(targetSection)}
            disabled={isExecuting}
            className="gap-1.5"
            style={{ backgroundColor: text.heading, color: background.card }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isExecuting ? 'Processing...' : 'Execute Promotion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
