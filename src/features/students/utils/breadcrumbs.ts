import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'

/**
 * Student page types for breadcrumb generation
 */
export type StudentPageType = 'list' | 'add' | 'edit' | 'details'

/**
 * Generates standardized breadcrumbs for student pages
 * 
 * @param page - The type of student page
 * @param studentName - Optional student name for details/edit pages
 * @returns Array of breadcrumb items
 */
export function getStudentBreadcrumbs(
  page: StudentPageType,
  studentName?: string,
): PageHeaderBreadcrumbItem[] {
  const baseBreadcrumbs: PageHeaderBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Students', href: '/students' },
  ]

  switch (page) {
    case 'list':
      return baseBreadcrumbs
    case 'add':
      return [...baseBreadcrumbs, { label: 'Add New Student' }]
    case 'edit':
      return [...baseBreadcrumbs, { label: 'Edit Student' }]
    case 'details':
      return [...baseBreadcrumbs, { label: studentName || 'Student Details' }]
    default:
      return baseBreadcrumbs
  }
}
