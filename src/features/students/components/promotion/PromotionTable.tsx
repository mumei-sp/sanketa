/**
 * PromotionTable — Review table for student promotion decisions.
 *
 * Shows student info with percentage, GPA, performance badge, and
 * decision toggle (Promote / Retain / Transfer).
 */

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUp, X, ArrowRight } from 'lucide-react'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { colors } from '@/theme/colors'
import type { PromotionCandidate, PromotionDecision } from '../../types/promotion'

interface PromotionTableProps {
  candidates: PromotionCandidate[]
  onDecisionChange: (studentId: string, decision: PromotionDecision) => void
}

const DECISION_OPTIONS: { value: PromotionDecision; label: string; icon: React.ElementType; activeColor: string }[] = [
  { value: 'promote', label: 'Promote', icon: ArrowUp, activeColor: colors.status.success.base },
  { value: 'retain', label: 'Retain', icon: X, activeColor: colors.status.danger.base },
  { value: 'transfer', label: 'Transfer', icon: ArrowRight, activeColor: colors.text.heading },
]

const PERFORMANCE_STYLES: Record<string, { bg: string; color: string }> = {
  Good: { bg: colors.accent.base, color: colors.text.heading },
  'Needs Support': { bg: colors.status.warning.soft, color: colors.status.warning.text },
  'At Risk': { bg: colors.status.danger.soft, color: colors.status.danger.text },
}

export function PromotionTable({ candidates, onDecisionChange }: PromotionTableProps) {
  const columns: ColumnDef<PromotionCandidate>[] = React.useMemo(() => [
    {
      accessorKey: 'rollNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Roll #" />,
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{row.original.rollNumber}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden"
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', backgroundColor: colors.accent.base, color: colors.text.heading }}
            >
              {s.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <span className="text-sm font-medium text-text-heading">{s.studentName}</span>
              {s.status === 'On Leave' && (
                <span
                  className="text-[9px] font-medium rounded-full px-1.5 py-px ml-1.5"
                  style={{ backgroundColor: colors.border.default, color: colors.text.muted }}
                >
                  On Leave
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'percentage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="%" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold" style={{ color: colors.text.heading, fontVariantNumeric: 'tabular-nums' }}>
          {row.original.percentage}%
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'gpa',
      header: ({ column }) => <DataTableColumnHeader column={column} title="GPA" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium" style={{ color: colors.text.heading, fontVariantNumeric: 'tabular-nums' }}>
          {row.original.gpa}
        </span>
      ),
      size: 60,
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        const perf = row.original.performance
        const style = PERFORMANCE_STYLES[perf] || PERFORMANCE_STYLES.Good
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {perf}
          </span>
        )
      },
      size: 120,
      enableSorting: false,
    },
    {
      id: 'decision',
      header: 'Decision',
      cell: ({ row }) => {
        const { studentId, decision } = row.original
        return (
          <div className="flex items-center gap-1.5">
            {DECISION_OPTIONS.map(opt => {
              const isActive = decision === opt.value
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDecisionChange(studentId, opt.value)}
                  className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 cursor-pointer transition-all"
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
      },
      size: 260,
      enableSorting: false,
    },
  ], [onDecisionChange])

  return (
    <DataTable
      columns={columns}
      data={candidates}
      enableSorting
      enablePagination={false}
      showToolbar={false}
      bodyProps={{ rowClassName: 'hover:bg-accent/20' }}
    />
  )
}
