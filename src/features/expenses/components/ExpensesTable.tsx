import * as React from 'react'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { Download, Receipt } from 'lucide-react'
import { useCsvExport } from '@/lib/use-csv-export'
import { DataTable, MobileRecordCard } from '@/components/table'
import { GridPagination } from '@/components/pagination/GridPagination'
import { Skeleton } from '@/components/ui/skeleton'
import { expenseColumns, ExpenseCategoryTag } from './expense-columns'
import { cn } from '@/lib/utils'
import {
  ListToolbar,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
} from '@/components/table'

/** Shared look for the accent filter selects in this toolbar. */
const FILTER_TRIGGER = 'bg-accent text-foreground border-0 hover:bg-accent/80'
import type { Expense, ExpenseCategory } from '@/features/expenses/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExpensesTableProps {
  data: Expense[]
  isLoading?: boolean
}

const CATEGORIES: ExpenseCategory[] = ['Salaries', 'Supplies', 'Maintenance', 'Events', 'Others']

const EXPORT_COLUMNS = [
  { key: 'expenseId' as const, header: 'Expense ID' },
  { key: 'date' as const, header: 'Date' },
  { key: 'department' as const, header: 'Department' },
  { key: 'category' as const, header: 'Category' },
  { key: 'description' as const, header: 'Description' },
  { key: 'quantity' as const, header: 'Quantity' },
  { key: 'amount' as const, header: 'Amount' },
]

export function ExpensesTable({ data, isLoading = false }: ExpensesTableProps) {
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [timeFilter, setTimeFilter] = React.useState<string>('this-month')

  const exportCsv = useCsvExport({
    rows: data,
    columns: EXPORT_COLUMNS,
    filename: 'expenses',
    label: 'expenses',
  })

  const renderToolbar = React.useCallback(
    (table: TanStackTable<Expense>) => {
      const handleCategoryChange = (value: string) => {
        setCategoryFilter(value)
        const categoryColumn = table.getColumn('category')
        if (categoryColumn) {
          categoryColumn.setFilterValue(value === 'all' ? undefined : value)
        }
      }

      return (
        <ListToolbar
          title="Expenses"
          filters={[
            {
              id: 'category',
              label: 'Category',
              isActive: categoryFilter !== 'all',
              control: (
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, FILTER_TRIGGER, 'w-[140px]', TOOLBAR_FILTER_CONTROL)}>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            },
            {
              id: 'period',
              label: 'Period',
              isActive: timeFilter !== 'this-month',
              control: (
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, FILTER_TRIGGER, 'w-[120px]', TOOLBAR_FILTER_CONTROL)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ]}
          secondaryActions={[
            { id: 'export', label: 'Export', icon: <Download className="size-4" />, onSelect: exportCsv },
          ]}
        />
      )
    },
    [categoryFilter, timeFilter, exportCsv],
  )

  const renderPagination = React.useCallback((table: TanStackTable<Expense>) => {
    const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
    const totalRows = table.getFilteredRowModel().rows.length
    return (
      <GridPagination
        currentPage={pageIndex + 1}
        totalItems={totalRows}
        pageSize={currentPageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(size) => table.setPageSize(size)}
        pageSizeOptions={[8, 16, 24, 48]}
      />
    )
  }, [])

  // Below `lg` each expense row becomes a card — seven columns of ₹ amounts and
  // free-text descriptions are unreadable side by side on a phone.
  const renderMobileCard = React.useCallback((row: Row<Expense>) => {
    const expense = row.original
    return (
      <MobileRecordCard
        title={expense.description}
        subtitle={expense.expenseId}
        trailing={
          <span className="text-body font-semibold" style={{ color: 'var(--heading)' }}>
            ₹{expense.amount.toLocaleString('en-IN')}
          </span>
        }
        fields={[
          { label: 'Category', value: <ExpenseCategoryTag category={expense.category} /> },
          { label: 'Department', value: expense.department },
          { label: 'Date', value: expense.date },
          { label: 'Quantity', value: expense.quantity != null ? expense.quantity : '-' },
        ]}
      />
    )
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[120px]" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[140px]" />
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <DataTable
      columns={expenseColumns}
      data={data}
      enableSorting
      enablePagination
      enableFiltering
      enableGlobalFilter={false}
      showToolbar={true}
      renderToolbar={renderToolbar}
      renderPagination={renderPagination}
      renderMobileCard={renderMobileCard}
      empty={{
        icon: <Receipt />,
        title: 'No expenses yet',
        description: 'Recorded spending will appear here once it is logged.',
      }}
      tableOptions={{
        initialState: {
          pagination: {
            pageSize: 8,
          },
        },
      }}
    />
  )
}
