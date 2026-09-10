import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { Student } from '@/features/students/types'
import { PerformanceBadge } from './PerformanceBadge'
import { StatusBadge } from './StatusBadge'
import { AttendanceIndicator } from './AttendanceIndicator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/**
 * TanStack Table column definitions for Students table
 */
export const studentColumns: ColumnDef<Student>[] = [
  {
    id: 'student',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
    cell: ({ row }) => {
      const student = row.original
      const initials = (student.name ?? '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback className="bg-muted text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{student.name}</span>
            <span className="text-body-muted text-muted-foreground">{student.studentId}</span>
          </div>
        </div>
      )
    },
    enableSorting: true,
    filterFn: (row, _id, value) => {
      const student = row.original
      const searchValue = value.toLowerCase()
      return (
        (student.name ?? '').toLowerCase().includes(searchValue) ||
        student.studentId.toLowerCase().includes(searchValue)
      )
    },
  },
  {
    accessorKey: 'class',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.class}</span>
    },
    /**
     * Accepts either a single class label ("7A") or an array of labels
     * (["7A", "8B"]) so the toolbar can plug in a multi-select picker.
     * Undefined / empty array = no filter.
     */
    filterFn: (row, _id, value) => {
      if (value === undefined || value === null) return true
      if (Array.isArray(value)) {
        if (value.length === 0) return true
        return value.includes(row.original.class ?? '')
      }
      return row.original.class === value
    },
    enableSorting: true,
  },
  {
    accessorKey: 'gpa',
    header: ({ column }) => <DataTableColumnHeader column={column} title="GPA" />,
    cell: ({ row }) => {
      return (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {row.original.gpa.toFixed(1)}
        </span>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'performance',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Performance" />,
    cell: ({ row }) => {
      return <PerformanceBadge performance={row.original.performance} />
    },
    enableSorting: true,
  },
  {
    accessorKey: 'percentage',
    // `percentage` is the academic score — `performance` is derived from it and
    // the detail page prints it as a GPA. The column claimed to be attendance,
    // so the table asserted an attendance figure for every student that was in
    // fact their marks. Attendance lives in the registers, and putting it here
    // would mean a real column fed from them.
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avg. Score" />,
    cell: ({ row }) => {
      return <AttendanceIndicator value={row.original.percentage} />
    },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />
    },
    enableSorting: true,
    filterFn: (row, _id, value) => {
      if (value === 'all' || !value) return true
      return row.original.status === value
    },
  },
]

