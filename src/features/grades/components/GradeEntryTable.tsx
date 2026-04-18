/**
 * GradeEntryTable — Desktop table for entering student marks.
 *
 * Uses DataTable with editable marks inputs and auto-calculated grade badges.
 * Row tinting: green-ish for passing, subtle red for failing.
 */

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { colors } from '@/theme/colors'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import type { GradeEntry } from '../types'

interface GradeEntryTableProps {
  entries: GradeEntry[]
  onMarksChange: (studentId: string, marks: number | null) => void
  onRemarksChange: (studentId: string, remarks: string) => void
  disabled?: boolean
}

export function GradeEntryTable({
  entries,
  onMarksChange,
  onRemarksChange,
  disabled = false,
}: GradeEntryTableProps) {
  const { calculateGrade } = useGradeCalculator()

  const columns: ColumnDef<GradeEntry>[] = React.useMemo(() => [
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
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-2.5">
            <StudentAvatar name={s.studentName} />
            <span className="text-sm font-medium text-text-heading">{s.studentName}</span>
          </div>
        )
      },
    },
    // Marks (editable)
    {
      id: 'marks',
      header: 'Marks',
      cell: ({ row }) => (
        <input
          type="number"
          value={row.original.marksObtained ?? ''}
          onChange={e => {
            const val = e.target.value
            onMarksChange(row.original.studentId, val === '' ? null : Math.min(row.original.maxMarks, Math.max(0, parseInt(val) || 0)))
          }}
          min={0}
          max={row.original.maxMarks}
          disabled={disabled}
          placeholder="—"
          className="w-[72px] text-sm rounded-md border px-2.5 py-1.5 outline-none transition-colors focus:ring-1 border-border-default text-text-heading bg-bg-card text-center"
        />
      ),
      size: 90,
      enableSorting: false,
    },
    // Out of
    {
      id: 'outOf',
      header: '/ Max',
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">/ {row.original.maxMarks}</span>
      ),
      size: 60,
      enableSorting: false,
    },
    // Percentage (auto-calculated)
    {
      id: 'percentage',
      header: '%',
      cell: ({ row }) => {
        const { marksObtained, maxMarks } = row.original
        if (marksObtained === null) return <span className="text-sm text-text-muted">—</span>
        const result = calculateGrade(marksObtained, maxMarks)
        return <span className="text-sm font-medium text-text-heading">{result.percentage}%</span>
      },
      size: 70,
      enableSorting: false,
    },
    // Grade badge (auto-calculated)
    {
      id: 'grade',
      header: 'Grade',
      cell: ({ row }) => {
        const { marksObtained, maxMarks } = row.original
        if (marksObtained === null) return <span className="text-sm text-text-muted">—</span>
        const result = calculateGrade(marksObtained, maxMarks)
        return (
          <span
            className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap"
            style={{
              backgroundColor: result.isPassing ? 'var(--accent)' : colors.status.danger.soft,
              color: result.isPassing ? 'var(--heading)' : colors.status.danger.text,
              minWidth: 'fit-content',
            }}
          >
            {result.label}
          </span>
        )
      },
      size: 80,
      enableSorting: false,
    },
    // Remarks
    {
      id: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <input
          type="text"
          value={row.original.remarks}
          onChange={e => onRemarksChange(row.original.studentId, e.target.value)}
          placeholder="Optional..."
          disabled={disabled}
          className="w-full text-sm rounded-md border px-2.5 py-1.5 outline-none transition-colors focus:ring-1 border-border-default text-text-body bg-bg-card"
        />
      ),
      enableSorting: false,
    },
  ], [calculateGrade, onMarksChange, onRemarksChange, disabled])

  return (
    <DataTable
      columns={columns}
      data={entries}
      enableSorting
      enablePagination={false}
      showToolbar={false}
      bodyProps={{ rowClassName: 'hover:bg-accent/20' }}
    />
  )
}
