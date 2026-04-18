import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { Expense, ExpenseCategory } from '@/features/expenses/types'
import { baseColors } from '@/theme/colors'

const CATEGORY_DOT_COLORS: Record<ExpenseCategory, string> = {
  Salaries: 'var(--heading)',
  Supplies: 'var(--primary)',
  Maintenance: '#94A3B8',
  Events: '#A5D6A7',
  Others: '#E0E0E0',
}

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: 'expenseId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expense ID" />,
    cell: ({ row }) => (
      <span className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>
        {row.original.expenseId}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.date}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    cell: ({ row }) => (
      <span className="text-xs">{row.original.department}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: CATEGORY_DOT_COLORS[category] || '#E0E0E0' }}
          />
          <span className="text-xs">{category}</span>
        </div>
      )
    },
    enableSorting: true,
    filterFn: (row, _id, value) => {
      if (value === 'all' || !value) return true
      return row.original.category === value
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.description}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.quantity != null ? row.original.quantity : '-'}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>
        ₹{row.original.amount.toLocaleString('en-IN')}
      </span>
    ),
    enableSorting: true,
  },
]
