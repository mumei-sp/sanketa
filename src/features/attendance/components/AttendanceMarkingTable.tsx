import * as React from 'react'
import type { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { createMarkingColumns, type MarkingRowData } from './attendance-marking-columns'
import type { ClassRosterStudent, MarkableAttendanceStatus } from '../types'

interface AttendanceMarkingTableProps {
  /** Student roster */
  roster: ClassRosterStudent[]
  /** Current entries: studentId → { status, note } */
  entries: Record<string, { status: MarkableAttendanceStatus | undefined; note: string }>
  /** Called when a student's status changes */
  onStatusChange: (studentId: string, status: MarkableAttendanceStatus) => void
  /** Called when a student's note changes */
  onNoteChange: (studentId: string, note: string) => void
  /** Disable all interactions */
  disabled?: boolean
}

/**
 * Desktop table view for marking attendance.
 * Uses the project's DataTable component with column definitions from attendance-marking-columns.
 * Row tinting based on attendance status via rowClassName callback.
 */
export function AttendanceMarkingTable({
  roster,
  entries,
  onStatusChange,
  onNoteChange,
  disabled = false,
}: AttendanceMarkingTableProps) {
  // Merge roster + entries into flat row data for DataTable
  const tableData: MarkingRowData[] = React.useMemo(
    () =>
      roster.map(student => ({
        ...student,
        status: entries[student.id]?.status,
        note: entries[student.id]?.note ?? '',
      })),
    [roster, entries],
  )

  // Column definitions (recreated when callbacks change)
  const columns = React.useMemo(
    () => createMarkingColumns({ onStatusChange, onNoteChange, disabled }),
    [onStatusChange, onNoteChange, disabled],
  )

  // Row tinting based on attendance status
  const rowClassName = React.useCallback((row: Row<MarkingRowData>) => {
    const { status } = row.original
    if (status === 'present') return 'bg-status-success-soft'
    if (status === 'late') return 'bg-status-warning-soft'
    if (status === 'absent') return 'bg-status-danger-soft'
    return ''
  }, [])

  return (
    <DataTable
      columns={columns}
      data={tableData}
      enableSorting
      enablePagination={false}
      showToolbar={false}
      bodyProps={{ rowClassName }}
    />
  )
}
