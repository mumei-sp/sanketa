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
    return row.original.isSubmitted ? '' : 'bg-primary-soft'
  }, [])


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
      // The page already wraps this in a card `Tile`; the skeleton this
      // replaced rendered a SECOND one inside it, so the history view briefly
      // showed a card within a card. Twelve rows is the reservation that
      // skeleton made, kept here — the table has no pagination, so a page size
      // would be a meaningless number to reserve against.
      isLoading={isLoading}
      loadingRowCount={12}
      enableSorting
      enablePagination={false}
      showToolbar={false}
      bodyProps={{ rowClassName }}
    />
  )
}
