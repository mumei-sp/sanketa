import type { Table as TanStackTable } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Props for DataTablePaginationCustom component
 */
export interface DataTablePaginationCustomProps<TData> {
  /** TanStack table instance */
  table: TanStackTable<TData>
  /** Optional custom className for the container */
  className?: string
}

/** Shared sizing for every pager button — compact by default, tap-sized on touch. */
const PAGER_BUTTON =
  'tap-target flex h-8 min-w-10 items-center justify-center rounded-md px-3 text-body font-medium transition-colors'

/**
 * The window of page numbers to render, centred on the current page.
 * Phones get a narrower window so the pager never outgrows the viewport.
 */
function getPageWindow(pageCount: number, currentPage: number, maxPagesToShow: number): number[] {
  let startPage = 1
  let endPage = Math.min(maxPagesToShow, pageCount)

  // If we're near the end, show the last pages
  if (currentPage > pageCount - 2 && pageCount > maxPagesToShow) {
    startPage = Math.max(1, pageCount - maxPagesToShow + 1)
    endPage = pageCount
  } else if (currentPage > 2 && pageCount > maxPagesToShow) {
    // Show pages around current
    startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    endPage = Math.min(pageCount, startPage + maxPagesToShow - 1)
  }

  const pagesToShow: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.push(i)
  }
  return pagesToShow
}

/**
 * Reusable custom pagination component for DataTable
 * Matches the reference UI design with consistent styling.
 *
 * Below `sm` the row-count summary and the pager stack instead of scrolling
 * sideways, and the page window narrows to three so it fits a phone.
 */
export function DataTablePaginationCustom<TData>({
  table,
  className,
}: DataTablePaginationCustomProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const isMobile = useIsMobile()
  const pagesToShow = getPageWindow(table.getPageCount(), pageIndex + 1, isMobile ? 3 : 5)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-3 px-4 min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-body-muted text-muted-foreground sm:flex-shrink-0">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
          className="tap-target h-8 rounded-md border border-input bg-background px-2 text-body"
          aria-label="Rows per page"
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>of {totalRows} results</span>
      </div>
      <div className="flex items-center justify-center gap-2 sm:justify-end sm:flex-shrink-0">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={cn(
            PAGER_BUTTON,
            'border border-input bg-background',
            'hover:bg-accent hover:text-accent-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label="Previous page"
        >
          {'<'}
        </button>
        {pagesToShow.map(pageNum => {
          const isActive = pageIndex + 1 === pageNum
          return (
            <button
              key={pageNum}
              onClick={() => table.setPageIndex(pageNum - 1)}
              className={cn(
                PAGER_BUTTON,
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              )}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={cn(
            PAGER_BUTTON,
            'border border-input bg-background',
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

