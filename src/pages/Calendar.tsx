import PageHeader from '@/components/layout/PageHeader'

export default function Calendar() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
      />
    </div>
  )
}
