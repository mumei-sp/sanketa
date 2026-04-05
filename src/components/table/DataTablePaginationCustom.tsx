import type { Table as TanStackTable } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

/**
 * Props for DataTablePaginationCustom component
 */
export interface DataTablePaginationCustomProps<TData> {
  /** TanStack table instance */
  table: TanStackTable<TData>
  /** Optional custom className for the container */
  className?: string
}

/**
 * Reusable custom pagination component for DataTable
 * Matches the reference UI design with consistent styling
 */
export function DataTablePaginationCustom<TData>({
  table,
  className,
}: DataTablePaginationCustomProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3 px-4 overflow-x-auto min-w-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-body-muted text-muted-foreground flex-shrink-0">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
          className="h-8 rounded-md border border-input bg-background px-2 text-body"
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
            'flex h-8 min-w-10 items-center justify-center rounded-md border border-input bg-background px-3 text-body font-medium transition-colors',
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
                  'flex h-8 min-w-10 items-center justify-center rounded-md px-3 text-body font-medium transition-colors',
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
            'flex h-8 min-w-10 items-center justify-center rounded-md border border-input bg-background px-3 text-body font-medium transition-colors',
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
}

