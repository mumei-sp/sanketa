import * as React from 'react'
import type { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { createHistoryColumns } from './attendance-history-columns'
import type { AttendanceHistoryRow } from '../types'

interface AttendanceHistoryTableProps {
  /** History rows (most recent first) */
  rows: AttendanceHistoryRow[]
  /** Loading state */
  isLoading: boolean
  /** Called when user clicks Edit on a submitted row */
  onEdit: (date: string) => void
  /** Called when user clicks Mark on an unsubmitted row */
  onMark: (date: string) => void
}

/**
 * Table showing attendance history for a class in a month.
 * Uses the project's DataTable component with column definitions from attendance-history-columns.
 * Unsubmitted rows are highlighted with a warning background.
 */
export function AttendanceHistoryTable({
  rows,
  isLoading,
  onEdit,
  onMark,
}: AttendanceHistoryTableProps) {
  const columns = React.useMemo(
    () => createHistoryColumns({ onEdit, onMark }),
    [onEdit, onMark],
  )

  // Highlight unsubmitted rows
  const rowClassName = React.useCallback((row: Row<AttendanceHistoryRow>) => {
    return row.original.isSubmitted ? '' : 'bg-status-warning-soft'
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-text-muted">Loading history...</span>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-text-muted">No records for this month</span>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enablePagination={false}
      showToolbar={false}
      bodyProps={{ rowClassName }}
    />
  )
}
