import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TileWrapper, Tile } from '@/components/tile'

export interface AttendancePageLayoutProps {
  /** Page title */
  title: string
  /** Breadcrumb items */
  breadcrumbs: PageHeaderBreadcrumbItem[]
  /** Whether to show back button */
  showBackButton?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Error message or null */
  error?: string | null
  /** Error action button text */
  errorActionLabel?: string
  /** Error action handler */
  onErrorAction?: () => void
  /** Loading message */
  loadingMessage?: string
  /** Page content (rendered when not loading and no error) */
  children: React.ReactNode
}

/**
 * AttendancePageLayout - Shared layout component for attendance pages
 * 
 * Handles PageHeader rendering for all states (loading, error, main) to eliminate duplication
 * across attendance pages.
 * 
 * @example
 * ```tsx
 * <AttendancePageLayout
 *   title="Attendance"
 *   breadcrumbs={getAttendanceBreadcrumbs('list')}
 *   isLoading={isLoading}
 *   error={error}
 *   onErrorAction={() => navigate('/attendance')}
 * >
 *   <AttendanceTable ... />
 * </AttendancePageLayout>
 * ```
 */
export function AttendancePageLayout({
  title,
  breadcrumbs,
  showBackButton = false,
  isLoading = false,
  error = null,
  errorActionLabel = 'Back to Attendance',
  onErrorAction,
  loadingMessage: _loadingMessage = 'Loading...',
  children,
}: AttendancePageLayoutProps) {
  // Render PageHeader for all states
  const renderPageHeader = () => (
    <PageHeader
      title={title}
      breadcrumbs={breadcrumbs}
      showBackButton={showBackButton}
    />
  )

  // Loading state - skeleton screen
  if (isLoading) {
    return (
      <div className="space-y-4">
        {renderPageHeader()}

        {/* Attendance Summary skeleton + Chart skeleton */}
        <TileWrapper columns={{ default: 1, lg: 12 }} gap={12}>
          {/* Summary cards skeleton (7 cols) */}
          <Tile id="summary-skeleton" layoutMode="block" width={{ default: 1, lg: 7 }}>
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-[180px]" />
                <Skeleton className="h-8 w-[140px] rounded-md" />
              </div>
              {/* 3 summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden shadow-xs bg-card">
                    {/* Colored top section */}
                    <Skeleton className="h-[100px] w-full rounded-none" />
                    {/* Breakdown bottom section */}
                    <div className="p-4 flex gap-4">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex flex-col items-center gap-1.5 flex-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-5 w-8" />
                          <Skeleton className="h-4 w-10 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tile>

          {/* Chart skeleton (5 cols) */}
          <Tile
            id="chart-skeleton"
            layoutMode="block"
            width={{ default: 1, lg: 5 }}
            className="h-[280px] lg:h-full"
            background="card"
            borderRadius="lg"
            shadowed={true}
            padding="p-4"
          >
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-8 w-[110px] rounded-md" />
              </div>
              <Skeleton className="flex-1 w-full min-h-[180px] rounded" />
            </div>
          </Tile>
        </TileWrapper>

        {/* Attendance Table skeleton */}
        <Tile
          id="table-skeleton"
          layoutMode="block"
          widthPx="100%"
          background="card"
          borderRadius="lg"
          shadowed={false}
          padding="p-6"
        >
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Skeleton className="h-6 w-[120px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-[200px] rounded-lg" />
                <Skeleton className="h-8 w-[120px] rounded-md" />
                <Skeleton className="h-8 w-[140px] rounded-md" />
              </div>
            </div>
            {/* Table header */}
            <Skeleton className="h-10 w-full rounded" />
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        </Tile>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        {renderPageHeader()}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            {onErrorAction && (
              <Button onClick={onErrorAction} variant="outline">
                {errorActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <div className="space-y-4">
      {renderPageHeader()}
      {children}
    </div>
  )
}

