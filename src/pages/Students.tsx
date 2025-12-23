import PageHeader from '@/components/layout/PageHeader'

export default function Students() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Students' }]}
      />
    </div>
  )
}
