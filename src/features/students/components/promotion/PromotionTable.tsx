/**
 * PromotionTable — Review table for student promotion decisions.
 *
 * Shows student info with percentage, GPA, performance badge, and
 * decision toggle (Promote / Retain / Transfer).
 */

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { colors } from '@/theme/colors'
import { PerformanceBadge } from '../PerformanceBadge'
import { DecisionToggle } from './DecisionToggle'
import type { PromotionCandidate, PromotionDecision } from '../../types/promotion'
import type { StudentPerformance } from '../../types'

interface PromotionTableProps {
  candidates: PromotionCandidate[]
  onDecisionChange: (studentId: string, decision: PromotionDecision) => void
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
            <StudentAvatar name={s.studentName} />
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
        <span className="text-sm font-semibold" style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}>
          {row.original.percentage}%
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'gpa',
      header: ({ column }) => <DataTableColumnHeader column={column} title="GPA" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium" style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}>
          {row.original.gpa}
        </span>
      ),
      size: 60,
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      cell: ({ row }) => (
        <PerformanceBadge
          performance={row.original.performance as StudentPerformance}
          variant="compact"
        />
      ),
      size: 120,
      enableSorting: false,
    },
    {
      id: 'decision',
      header: 'Decision',
      cell: ({ row }) => (
        <DecisionToggle
          currentValue={row.original.decision}
          onSelect={v => onDecisionChange(row.original.studentId, v)}
          layout="table"
        />
      ),
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
