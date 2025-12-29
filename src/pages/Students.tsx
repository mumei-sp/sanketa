import PageHeader from '@/components/layout/PageHeader'
import { StudentsPage } from '@/features/students/pages/StudentsPage'

export default function Students() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Students' }]}
      />

      <StudentsPage />
    </div>
  )
}
