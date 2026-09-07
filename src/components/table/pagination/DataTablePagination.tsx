import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDataTable } from '../DataTableContext'
import { cn } from '@/lib/utils'
import type { Table as TanStackTable } from '@tanstack/react-table'

/**
 * Props for DataTablePagination component.
 * Provides page navigation, page size selection, and row selection info.
 */
export interface DataTablePaginationProps<TData> {
  renderPagination?: (table: TanStackTable<TData>) => React.ReactNode
  className?: string
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showPageInfo?: boolean
  showNavigation?: boolean
  renderPageInfo?: (table: TanStackTable<TData>) => React.ReactNode
  renderNavigation?: (table: TanStackTable<TData>) => React.ReactNode
  showRowSelectionInfo?: boolean
  renderRowSelectionInfo?: (table: TanStackTable<TData>) => React.ReactNode
  layout?: 'default' | 'compact' | 'spacious'
}

/**
 * Pagination controls for DataTable.
 * Includes page navigation, page size selector, and row selection info.
 *
 * @example
 * ```tsx
 * <DataTablePagination
 *   pageSizeOptions={[10, 20, 50, 100]}
 *   showPageInfo
 *   showNavigation
 * />
 * ```
 */
export function DataTablePagination<TData>({
  renderPagination,
  className,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showPageSizeSelector = true,
  showPageInfo = true,
  showNavigation = true,
  renderPageInfo,
  renderNavigation,
  showRowSelectionInfo = true,
  renderRowSelectionInfo,
  layout = 'default',
}: DataTablePaginationProps<TData>) {
  const table = useDataTable<TData>()

  if (renderPagination) {
    return <>{renderPagination(table)}</>
  }

  const layoutClasses = {
    default: 'flex items-center justify-between px-2',
    compact: 'flex items-center justify-between px-2 gap-2',
    spacious: 'flex items-center justify-between px-2 gap-4',
  }

  const isRowSelectionEnabled = table.options.enableRowSelection !== false

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {showRowSelectionInfo && isRowSelectionEnabled && (
        <div className="flex-1 text-sm text-muted-foreground">
          {renderRowSelectionInfo ? (
            renderRowSelectionInfo(table)
          ) : (
            <>
              {table.getFilteredRowModel().rows.filter(row => row.getIsSelected()).length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
      )}
      <div className="flex items-center space-x-6 lg:space-x-8">
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={value => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map(pageSize => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {showPageInfo && (
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {renderPageInfo ? (
              renderPageInfo(table)
            ) : (
              <>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </>
            )}
          </div>
        )}
        {showNavigation && (
          <div className="flex items-center space-x-2">
            {renderNavigation ? (
              renderNavigation(table)
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden size-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 p-0 lg:flex"
                  onClick={() => {
                    const pageCount = table.getPageCount()
                    if (pageCount > 0) {
                      table.setPageIndex(pageCount - 1)
                    }
                  }}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
