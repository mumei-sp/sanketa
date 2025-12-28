import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { primary, accent, text, background, border } from '@/theme/colors'
import { textRoles } from '@/config/typography'

/**
 * Props for GridPagination component
 * Generic pagination component that can be used for grid layouts
 */
export interface GridPaginationProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of items */
  totalItems: number
  /** Items per page */
  pageSize: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void
  /** Page size options */
  pageSizeOptions?: number[]
  /** Optional custom className for the container */
  className?: string
}

/**
 * Reusable pagination component for grid layouts
 * Matches the DataTablePaginationCustom design with consistent styling
 */
export function GridPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 16, 24, 32],
  className,
}: GridPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)

  // Calculate which pages to show
  const maxPagesToShow = 5
  let startPage = 1
  let endPage = Math.min(maxPagesToShow, totalPages)

  // If we're near the end, show the last pages
  if (currentPage > totalPages - 2 && totalPages > maxPagesToShow) {
    startPage = Math.max(1, totalPages - maxPagesToShow + 1)
    endPage = totalPages
  } else if (currentPage > 2 && totalPages > maxPagesToShow) {
    // Show pages around current
    startPage = Math.max(1, currentPage - 2)
    endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  }

  const pagesToShow: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.push(i)
  }

  const handlePrevious = React.useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }, [currentPage, onPageChange])

  const handleNext = React.useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }, [currentPage, totalPages, onPageChange])

  const handlePageClick = React.useCallback(
    (page: number) => {
      onPageChange(page)
    },
    [onPageChange],
  )

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3 px-4 overflow-x-auto min-w-0 bg-transparent',
        className,
      )}
    >
      <div 
        className="flex items-center gap-2 flex-shrink-0"
        style={{
          fontSize: textRoles.body.fontSize,
          color: text.body,
        }}
      >
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => {
            onPageSizeChange(Number(e.target.value))
          }}
          className="h-8 rounded-md border px-2 font-medium transition-colors"
          style={{
            fontSize: textRoles.body.fontSize,
            backgroundColor: border.subtle,
            color: text.body,
            borderColor: border.default,
          }}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>of {totalItems} results</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex h-8 min-w-10 items-center justify-center rounded-md border px-3 font-medium transition-colors"
          style={{
            fontSize: textRoles.body.fontSize,
            backgroundColor: currentPage === 1 ? border.subtle : accent.base,
            color: text.body,
            borderColor: border.default,
          }}
          aria-label="Previous page"
        >
          <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
        </button>
        {pagesToShow.map(pageNum => {
          const isActive = currentPage === pageNum
          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              className="flex h-8 min-w-10 items-center justify-center rounded-md px-3 font-medium transition-colors"
              style={{
                fontSize: textRoles.body.fontSize,
                backgroundColor: isActive ? primary.base : accent.base,
                color: isActive ? background.card : text.body,
                border: isActive ? 'none' : `1px solid ${border.default}`,
              }}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex h-8 min-w-10 items-center justify-center rounded-md border px-3 font-medium transition-colors"
          style={{
            fontSize: textRoles.body.fontSize,
            backgroundColor: currentPage === totalPages ? border.subtle : accent.base,
            color: text.body,
            borderColor: border.default,
          }}
          aria-label="Next page"
        >
          <ChevronRight style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>
    </div>
  )
}
