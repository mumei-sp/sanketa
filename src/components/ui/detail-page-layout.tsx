import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

export interface DetailPageLayoutProps {
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
 * DetailPageLayout - Shared layout for detail pages (student, teacher, etc.).
 * Handles PageHeader rendering for loading, error, and main content states.
 */
export function DetailPageLayout({
  title,
  breadcrumbs,
  showBackButton = false,
  isLoading = false,
  error = null,
  errorActionLabel = 'Go Back',
  onErrorAction,
  loadingMessage = 'Loading...',
  children,
}: DetailPageLayoutProps) {
  const header = (
    <PageHeader
      title={title}
      breadcrumbs={breadcrumbs}
      showBackButton={showBackButton}
    />
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{loadingMessage}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {header}
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

  return (
    <div className="space-y-4">
      {header}
      {children}
    </div>
  )
}
