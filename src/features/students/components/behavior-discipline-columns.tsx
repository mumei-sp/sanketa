import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { BehaviorDisciplineRecord, BehaviorRecordType, BehaviorStatus } from '../types/behavior-discipline'
import { Button } from '@/components/ui/button'
import { baseColors } from '@/theme/colors'

const TYPE_COLORS: Record<BehaviorRecordType, string> = {
  'Positive Note': baseColors.blue,
  'Minor Issue': '#F59E0B', // amber
  'Major Issue': '#EF4444', // red
}

const STATUS_VARIANTS: Record<BehaviorStatus, 'default' | 'secondary' | 'outline'> = {
  'Record Recognition': 'default',
  'Recognition Recorded': 'secondary',
  'Issue Warning': 'outline',
  'Parent Notified': 'secondary',
  'Pending Review': 'outline',
}

export const behaviorDisciplineColumns: ColumnDef<BehaviorDisciplineRecord>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.date}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type & Details" />,
    cell: ({ row }) => {
      const record = row.original
      return (
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-medium"
            style={{ color: TYPE_COLORS[record.type] || baseColors.heading }}
          >
            {record.type}
          </span>
          <span className="text-xs text-muted-foreground">{record.details}</span>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'reportedBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reported By" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.reportedBy}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status/Action" />,
    cell: ({ row }) => {
      const status = row.original.status
      const variant = STATUS_VARIANTS[status] ?? 'outline'
      return (
        <Button variant={variant} size="sm" className="h-7 text-xs font-normal">
          {status}
        </Button>
      )
    },
    enableSorting: true,
  },
]
