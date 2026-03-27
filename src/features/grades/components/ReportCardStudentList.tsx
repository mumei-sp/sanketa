/**
 * ReportCardStudentList — Table of students with grade summaries.
 *
 * Click a row to preview that student's report card.
 */

import * as React from 'react'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { colors } from '@/theme/colors'
import type { GradeSheetRow } from '../types'

interface ReportCardStudentListProps {
  rows: GradeSheetRow[]
  onSelectStudent: (studentId: string) => void
  selectedStudentId: string | null
}

export function ReportCardStudentList({ rows, onSelectStudent, selectedStudentId }: ReportCardStudentListProps) {
  const columns: ColumnDef<GradeSheetRow>[] = React.useMemo(() => [
    {
      accessorKey: 'rollNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Roll #" />,
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{row.original.rollNumber}</span>
      ),
      size: 70,
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
            <span className="text-sm font-medium text-text-heading">{s.studentName}</span>
          </div>
        )
      },
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
            className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap"
            style={{ backgroundColor: colors.accent.base, color: colors.text.heading }}
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
    {
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelectStudent(row.original.studentId) }}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors cursor-pointer"
          style={{
            backgroundColor: colors.accent.base,
            color: colors.text.heading,
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      ),
      size: 90,
      enableSorting: false,
    },
  ], [onSelectStudent])

  const handleRowClick = React.useCallback((row: Row<GradeSheetRow>) => {
    onSelectStudent(row.original.studentId)
  }, [onSelectStudent])

  const renderRow = React.useCallback((row: Row<GradeSheetRow>) => {
    const isSelected = row.original.studentId === selectedStudentId
    return (
      <tr
        key={row.id}
        onClick={() => handleRowClick(row)}
        className="cursor-pointer transition-colors"
        style={{
          backgroundColor: isSelected ? colors.accent.base : undefined,
        }}
      >
        {row.getVisibleCells().map(cell => (
          <td key={cell.id} className="px-3 py-2.5">
            {typeof cell.column.columnDef.cell === 'function'
              ? cell.column.columnDef.cell(cell.getContext())
              : cell.getValue() as string}
          </td>
        ))}
      </tr>
    )
  }, [selectedStudentId, handleRowClick])

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enablePagination={false}
      showToolbar={false}
    />
  )
}
