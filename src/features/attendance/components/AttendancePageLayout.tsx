import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

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
  loadingMessage = 'Loading...',
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {renderPageHeader()}
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{loadingMessage}</div>
        </div>
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

