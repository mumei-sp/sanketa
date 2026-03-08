import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

export interface StudentPageLayoutProps {
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
 * StudentPageLayout - Shared layout component for student pages
 * 
 * Handles PageHeader rendering for all states (loading, error, main) to eliminate duplication
 * across AddStudent, EditStudent, and StudentDetails pages.
 * 
 * @example
 * ```tsx
 * <StudentPageLayout
 *   title="Edit Student"
 *   breadcrumbs={getStudentBreadcrumbs('edit')}
 *   showBackButton
 *   isLoading={isLoading}
 *   error={error}
 *   onErrorAction={() => navigate('/students')}
 * >
 *   <StudentForm ... />
 * </StudentPageLayout>
 * ```
 */
export function StudentPageLayout({
  title,
  breadcrumbs,
  showBackButton = false,
  isLoading = false,
  error = null,
  errorActionLabel = 'Back to Students',
  onErrorAction,
  loadingMessage = 'Loading...',
  children,
}: StudentPageLayoutProps) {
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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

  // Main content: min-w-0 so grid/flex children don't force horizontal scroll; overflow-x-hidden so page doesn't scroll horizontally (only inner modules like wide tables can); w-full for correct width.
  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden w-full">
      {renderPageHeader()}
      {children}
    </div>
  )
}

