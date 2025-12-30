import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { AttendanceTableData } from '../types'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatDateHeader } from '@/utils/date'

/**
 * Get all unique dates from attendance records
 */
function getUniqueDates(records: AttendanceTableData[]): string[] {
  const dateSet = new Set<string>()
  records.forEach(record => {
    Object.keys(record.attendance).forEach(date => dateSet.add(date))
  })
  return Array.from(dateSet).sort().reverse()
}

/**
 * Generate attendance column definitions dynamically based on date range
 */
export function generateAttendanceColumns(
  records: AttendanceTableData[],
): ColumnDef<AttendanceTableData>[] {
  const dateColumns = getUniqueDates(records)

  const columns: ColumnDef<AttendanceTableData>[] = [
    {
      id: 'person',
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Student"
          renderSortIcon={sortDirection => {
            if (sortDirection === 'desc') {
              return <ArrowDown className="ml-2 h-4 w-4 opacity-60" />
            }
            if (sortDirection === 'asc') {
              return <ArrowUp className="ml-2 h-4 w-4 opacity-60" />
            }
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-60" />
          }}
        />
      ),
      cell: ({ row }) => {
        const record = row.original
        const id = record.studentId || record.teacherId || record.staffId || 'N/A'

        return (
          <div className="flex items-center">
            <span className="text-muted-foreground">{id}</span>
            <span className="mx-1">-</span>
            <span className="font-normal">{record.name}</span>
          </div>
        )
      },
      enableSorting: true,
      filterFn: (row, _id, value) => {
        const record = row.original
        const searchValue = (value as string).toLowerCase()
        const recordId = record.studentId || record.teacherId || record.staffId || ''
        return (
          record.name.toLowerCase().includes(searchValue) ||
          recordId.toLowerCase().includes(searchValue)
        )
      },
    },
  ]

  // Add dynamic date columns
  dateColumns.forEach(dateStr => {
    columns.push({
      id: `date-${dateStr}`,
      accessorFn: row => row.attendance[dateStr] || 'na',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={formatDateHeader(dateStr)} />
      ),
      cell: ({ row }) => {
        const status = row.original.attendance[dateStr] || 'na'
        return (
          <div className="flex items-center justify-center">
            <AttendanceStatusBadge status={status} />
          </div>
        )
      },
      enableSorting: false,
    })
  })

  return columns
}

