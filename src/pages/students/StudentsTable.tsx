import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Table as TanStackTable } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { DataTable, DataTableSearch } from '@/components/table'
import { studentColumns } from './student-columns'
import type { Student } from './student.types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface StudentsTableProps {
  data: Student[]
  isLoading?: boolean
}

/**
 * Students table component using TanStack Table
 */
export function StudentsTable({ data, isLoading }: StudentsTableProps) {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  // Custom toolbar with search, filter, status dropdown, and add button
  const renderToolbar = React.useCallback(
    (table: TanStackTable<Student>) => {
      const studentColumn = table.getColumn('student')
      const searchValue = (studentColumn?.getFilterValue() as string) || ''

      const handleSearchChange = (value: string) => {
        if (studentColumn) {
          studentColumn.setFilterValue(value || undefined)
        }
      }

      const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        const statusColumn = table.getColumn('status')
        if (statusColumn) {
          if (value === 'all') {
            statusColumn.setFilterValue(undefined)
          } else {
            statusColumn.setFilterValue(value)
          }
        }
      }

      return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-foreground">Students</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-[250px] min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search for a student"
                value={searchValue}
                onChange={e => handleSearchChange(e.target.value)}
                className="h-8 w-full pl-10 bg-white border-gray-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate('/students/add')}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              <Plus className="size-4" />
              Add Student
            </Button>
          </div>
        </div>
      )
    },
    [navigate, statusFilter],
  )

  // Custom pagination matching reference UI
  const renderPagination = React.useCallback((table: TanStackTable<Student>) => {
    const { pageIndex, pageSize } = table.getState().pagination
    const totalRows = table.getFilteredRowModel().rows.length
    const startRow = pageIndex * pageSize + 1
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

    return (
      <div className="flex items-center justify-between gap-4 py-3 px-4 overflow-x-auto min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {[10, 20, 30, 40, 50].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>of {totalRows} results</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              'flex h-8 min-w-10 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            aria-label="Previous page"
          >
            {'<'}
          </button>
          {(() => {
            const pageCount = table.getPageCount()
            const currentPage = pageIndex + 1
            const maxPagesToShow = 5

            // Calculate which pages to show
            let startPage = 1
            let endPage = Math.min(maxPagesToShow, pageCount)

            // If we're near the end, show the last pages
            if (currentPage > pageCount - 2 && pageCount > maxPagesToShow) {
              startPage = Math.max(1, pageCount - maxPagesToShow + 1)
              endPage = pageCount
            } else if (currentPage > 2 && pageCount > maxPagesToShow) {
              // Show pages around current
              startPage = Math.max(1, currentPage - 2)
              endPage = Math.min(pageCount, startPage + maxPagesToShow - 1)
            }

            const pagesToShow: number[] = []
            for (let i = startPage; i <= endPage; i++) {
              pagesToShow.push(i)
            }

            return pagesToShow.map(pageNum => {
              const isActive = currentPage === pageNum
              return (
                <button
                  key={pageNum}
                  onClick={() => table.setPageIndex(pageNum - 1)}
                  className={cn(
                    'flex h-8 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  )}
                  aria-label={`Go to page ${pageNum}`}
                >
                  {pageNum}
                </button>
              )
            })
          })()}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              'flex h-8 min-w-10 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            aria-label="Next page"
          >
            {'>'}
          </button>
        </div>
      </div>
    )
  }, [])

  return (
    <DataTable
      columns={studentColumns}
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
            pageSize: 10,
          },
        },
      }}
    />
  )
}
