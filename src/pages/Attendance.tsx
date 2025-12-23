import PageHeader from '@/components/layout/PageHeader'

export default function Attendance() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Attendance' }]}
      />
    </div>
  )
}
