import PageHeader from '@/components/layout/PageHeader'

export default function Calendar() {
  return (
    <div className="page-container space-y-4">
      <PageHeader
        title="Calendar"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
      />
    </div>
  )
}
