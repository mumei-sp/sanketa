import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { Student } from './student.types'
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
      const initials = student.name
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
            <span className="text-sm text-muted-foreground">{student.studentId}</span>
          </div>
        </div>
      )
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      const student = row.original
      const searchValue = value.toLowerCase()
      return (
        student.name.toLowerCase().includes(searchValue) ||
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attendance" />,
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
    filterFn: (row, id, value) => {
      if (value === 'all' || !value) return true
      return row.original.status === value
    },
  },
]
