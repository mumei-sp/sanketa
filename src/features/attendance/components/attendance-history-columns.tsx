import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, AlertTriangle } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { colors, darken, baseColors } from '@/theme/colors'
import type { AttendanceHistoryRow } from '../types'

/** Format a YYYY-MM-DD date for display */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Format ISO timestamp to time */
function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface HistoryColumnCallbacks {
  onEdit: (date: string) => void
  onMark: (date: string) => void
}

/**
 * Column definitions for the attendance history table.
 * Same factory-function pattern as fee-collection-columns.tsx.
 */
export function createHistoryColumns(
  callbacks: HistoryColumnCallbacks,
): ColumnDef<AttendanceHistoryRow>[] {
  return [
    // Date
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-text-heading">
          {formatDate(row.original.date)}
        </span>
      ),
      sortingFn: (rowA, rowB) =>
        new Date(rowA.original.date).getTime() - new Date(rowB.original.date).getTime(),
    },

    // Present
    {
      accessorKey: 'present',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Present" />
      ),
      cell: ({ row }) =>
        row.original.isSubmitted ? (
          <span className="text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--accent) 85%, black)' }}>
            {row.original.present}
          </span>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        ),
    },

    // Late
    {
      accessorKey: 'late',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Late" />
      ),
      cell: ({ row }) =>
        row.original.isSubmitted ? (
          <span className="text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--primary) 80%, black)' }}>
            {row.original.late}
          </span>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        ),
    },

    // Absent
    {
      accessorKey: 'absent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Absent" />
      ),
      cell: ({ row }) =>
        row.original.isSubmitted ? (
          <span className="text-sm font-medium text-text-heading">
            {row.original.absent}
          </span>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        ),
    },

    // Marked By
    {
      accessorKey: 'submittedBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marked By" />
      ),
      cell: ({ row }) => {
        const { isSubmitted, submittedBy, submittedAt } = row.original
        if (!isSubmitted) {
          return <span className="text-sm text-text-muted">—</span>
        }
        return (
          <div>
            <span className="text-sm text-text-body">{submittedBy}</span>
            {submittedAt && (
              <span className="text-xs text-text-muted ml-1">
                ({formatTime(submittedAt)})
              </span>
            )}
          </div>
        )
      },
    },

    // Action
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const { isSubmitted, date } = row.original
        if (isSubmitted) {
          return (
            <button
              type="button"
              onClick={() => callbacks.onEdit(date)}
              className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 border transition-colors hover:opacity-80 border-border-default bg-bg-card text-text-heading"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )
        }
        return (
          <button
            type="button"
            onClick={() => callbacks.onMark(date)}
            className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 transition-colors hover:opacity-80"
            style={{
              color: 'var(--heading)',
              backgroundColor: 'var(--accent)',
              border: `1px solid ${'color-mix(in srgb, var(--accent) 90%, black)'}`,
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            Mark
          </button>
        )
      },
      enableSorting: false,
    },
  ]
}
