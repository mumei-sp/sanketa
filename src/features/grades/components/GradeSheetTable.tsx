/**
 * GradeSheetTable — Read-only spreadsheet view of grades across all subjects.
 *
 * Dynamic columns generated from subject list. Includes summary footer row
 * with class averages per subject.
 */

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { GradeSheetRow, GradeSheetSummary } from '../types'

interface GradeSheetTableProps {
  rows: GradeSheetRow[]
  summary: GradeSheetSummary
  subjectList: { id: string; name: string; shortName: string }[]
}

export function GradeSheetTable({ rows, summary, subjectList }: GradeSheetTableProps) {
  const columns: ColumnDef<GradeSheetRow>[] = React.useMemo(() => {
    const cols: ColumnDef<GradeSheetRow>[] = [
      // Roll #
      {
        accessorKey: 'rollNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Roll #" />,
        cell: ({ row }) => (
          <span className="text-sm text-text-muted">{row.original.rollNumber}</span>
        ),
        size: 70,
      },
      // Student
      {
        accessorKey: 'studentName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-text-heading">{row.original.studentName}</span>
        ),
      },
    ]

    // Subject columns (dynamic)
    subjectList.forEach(sub => {
      cols.push({
        id: `sub-${sub.id}`,
        header: sub.shortName,
        cell: ({ row }) => {
          const g = row.original.subjects[sub.id]
          if (!g || g.marks === null) {
            return <span className="text-sm text-text-muted">—</span>
          }
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium text-text-heading">{g.marks}</span>
              <span
                className="text-[10px] font-medium rounded px-1.5 py-px"
                style={{
                  backgroundColor: colors.accent.base,
                  color: colors.text.heading,
                }}
              >
                {g.grade}
              </span>
            </div>
          )
        },
        size: 80,
        enableSorting: false,
      })
    })

    // Aggregate columns
    cols.push(
      {
        accessorKey: 'total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-text-heading">{row.original.total}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'percentage',
        header: ({ column }) => <DataTableColumnHeader column={column} title="%" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-text-heading">{row.original.percentage}%</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'overallGrade',
        header: 'Grade',
        cell: ({ row }) => {
          const grade = row.original.overallGrade
          if (grade === '—') return <span className="text-sm text-text-muted">—</span>
          return (
            <span
              className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5"
              style={{
                backgroundColor: colors.accent.base,
                color: colors.text.heading,
              }}
            >
              {grade}
            </span>
          )
        },
        size: 80,
        enableSorting: false,
      },
      {
        accessorKey: 'gpa',
        header: ({ column }) => <DataTableColumnHeader column={column} title="GPA" />,
        cell: ({ row }) => (
          <span className="text-sm font-semibold" style={{ color: colors.text.heading }}>
            {row.original.gpa}
          </span>
        ),
        size: 60,
      },
    )

    return cols
  }, [subjectList])

  return (
    <div>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enablePagination={false}
        showToolbar={false}
      />

      {/* Summary footer */}
      {rows.length > 0 && (
        <div
          className="flex items-center gap-4 flex-wrap mt-3 rounded-lg"
          style={{
            padding: `${spacing['2.5']} ${spacing['3']}`,
            backgroundColor: colors.accent.base,
            border: `1px solid ${colors.accent.base}`,
          }}
        >
          <span className="text-xs font-semibold text-text-heading">Class Average:</span>
          {subjectList.map(sub => (
            <span key={sub.id} className="text-xs text-text-muted">
              {sub.shortName}: <strong className="text-text-heading">{summary.subjectAverages[sub.id] ?? '—'}</strong>
            </span>
          ))}
          <span className="text-xs text-text-muted">
            Overall: <strong className="text-text-heading">{summary.classAverage}%</strong>
          </span>
          <span className="text-xs text-text-muted">
            Pass: <strong style={{ color: colors.status.success.text }}>{summary.passCount}</strong>
            {' / '}
            Fail: <strong style={{ color: colors.status.danger.text }}>{summary.failCount}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
