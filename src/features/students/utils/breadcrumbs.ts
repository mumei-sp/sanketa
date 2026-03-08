import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'

/**
 * Student page types for breadcrumb generation
 */
export type StudentPageType = 'list' | 'add' | 'edit' | 'details' | 'extracurricular-edit'

/**
 * Generates standardized breadcrumbs for student pages.
 *
 * @param page - The type of student page
 * @param studentName - Optional student name for details / edit / extracurricular-edit pages
 * @param studentId - Optional student id; required for 'extracurricular-edit' to build the details link
 * @returns Array of breadcrumb items for PageHeader
 */
export function getStudentBreadcrumbs(
  page: StudentPageType,
  studentName?: string,
  studentId?: string,
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
    case 'extracurricular-edit':
      return [
        ...baseBreadcrumbs,
        {
          label: studentName || 'Student Details',
          href: studentId ? `/students/details/${studentId}` : undefined,
        },
        { label: 'Edit Extracurricular' },
      ]
    default:
      return baseBreadcrumbs
  }
}
