import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'

export type TeacherPageType = 'list' | 'add' | 'edit' | 'details'

/**
 * Generates standardized breadcrumbs for teacher pages
 */
export function getTeacherBreadcrumbs(
  page: TeacherPageType,
  teacherName?: string,
): PageHeaderBreadcrumbItem[] {
  const baseBreadcrumbs: PageHeaderBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Teachers', href: '/teachers' },
  ]

  switch (page) {
    case 'list':
      return baseBreadcrumbs
    case 'add':
      return [...baseBreadcrumbs, { label: 'Add Teacher' }]
    case 'edit':
      return [...baseBreadcrumbs, { label: 'Edit Teacher' }]
    case 'details':
      return [...baseBreadcrumbs, { label: teacherName || 'Teacher Details' }]
    default:
      return baseBreadcrumbs
  }
}
