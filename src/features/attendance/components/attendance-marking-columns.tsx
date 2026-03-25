import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { colors } from '@/theme/colors'
import { AttendanceStatusSelect } from './AttendanceStatusSelect'
import type { ClassRosterStudent, MarkableAttendanceStatus } from '../types'

/** Row data shape: roster student + mutable entry state */
export interface MarkingRowData extends ClassRosterStudent {
  status: MarkableAttendanceStatus | undefined
  note: string
}

interface MarkingColumnCallbacks {
  onStatusChange: (studentId: string, status: MarkableAttendanceStatus) => void
  onNoteChange: (studentId: string, note: string) => void
  disabled?: boolean
}

/**
 * Column definitions for the attendance marking table.
 *
 * Follows the same factory-function pattern as fee-collection-columns.tsx:
 * callbacks are captured by closure so cell renderers can call them.
 */
export function createMarkingColumns(
  callbacks: MarkingColumnCallbacks,
): ColumnDef<MarkingRowData>[] {
  return [
    // # (row index)
    {
      id: 'index',
      header: '#',
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{row.index + 1}</span>
      ),
      size: 40,
      enableSorting: false,
    },

    // Student (avatar + name)
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex items-center gap-2.5">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-8 h-8 rounded-full object-cover"
                style={{ backgroundColor: colors.accent.base }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: colors.accent.base,
                  color: colors.text.heading,
                }}
              >
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <span className="text-sm font-medium text-text-heading">
              {student.name}
            </span>
          </div>
        )
      },
    },

    // Roll #
    {
      accessorKey: 'rollNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roll #" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{row.original.rollNumber}</span>
      ),
      size: 80,
    },

    // Status (P / L / A toggle buttons)
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <AttendanceStatusSelect
          value={row.original.status}
          onChange={s => callbacks.onStatusChange(row.original.id, s)}
          disabled={callbacks.disabled}
        />
      ),
      size: 160,
      enableSorting: false,
    },

    // Note (conditional text input)
    {
      id: 'note',
      header: 'Note',
      cell: ({ row }) => {
        const { status, note, id } = row.original
        const showNote = status === 'late' || status === 'absent'

        if (!showNote) {
          return <span className="text-xs text-text-muted">—</span>
        }

        return (
          <input
            type="text"
            value={note}
            onChange={e => callbacks.onNoteChange(id, e.target.value)}
            placeholder="Add reason..."
            disabled={callbacks.disabled}
            className="w-full text-sm rounded-md border px-2.5 py-1.5 outline-none transition-colors focus:ring-1 border-border-default text-text-body bg-bg-card"
          />
        )
      },
      enableSorting: false,
    },
  ]
}
