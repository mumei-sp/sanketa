import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'

/**
 * Attendance page types for breadcrumb generation
 */
export type AttendancePageType = 'list' | 'details'

/**
 * Generates standardized breadcrumbs for attendance pages
 * 
 * @param page - The type of attendance page
 * @param detailsLabel - Optional label for details pages
 * @returns Array of breadcrumb items
 */
export function getAttendanceBreadcrumbs(
  page: AttendancePageType,
  detailsLabel?: string,
): PageHeaderBreadcrumbItem[] {
  const baseBreadcrumbs: PageHeaderBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Attendance', href: '/attendance' },
  ]

  switch (page) {
    case 'list':
      return baseBreadcrumbs
    case 'details':
      return [...baseBreadcrumbs, { label: detailsLabel || 'Attendance Details' }]
    default:
      return baseBreadcrumbs
  }
}

