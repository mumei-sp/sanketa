import type { PageHeaderBreadcrumbItem } from '@/components/layout/PageHeader'

export type GradePageType = 'entry' | 'sheet' | 'report-card'

export function getGradeBreadcrumbs(page: GradePageType): PageHeaderBreadcrumbItem[] {
  const base: PageHeaderBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Grades', href: '/grades/entry' },
  ]

  switch (page) {
    case 'entry':
      return [...base, { label: 'Grade Entry' }]
    case 'sheet':
      return [...base, { label: 'Grade Sheet' }]
    case 'report-card':
      return [...base, { label: 'Report Card' }]
    default:
      return base
  }
}
