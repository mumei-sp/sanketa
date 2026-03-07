import * as React from 'react'
import type { Table as TanStackTable } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { GridPagination } from '@/components/pagination/GridPagination'
import { Skeleton } from '@/components/ui/skeleton'
import { expenseColumns } from './expense-columns'
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

export function ExpensesTable({ data, isLoading = false }: ExpensesTableProps) {
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [timeFilter, setTimeFilter] = React.useState<string>('this-month')

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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-page-title text-foreground">Expenses</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
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
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    [categoryFilter, timeFilter],
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
