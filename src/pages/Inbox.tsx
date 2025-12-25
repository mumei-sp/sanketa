import PageHeader from '@/components/layout/PageHeader'

export default function Inbox() {
  return (
    <div className="page-container space-y-4">
      <PageHeader
        title="Inbox"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Inbox' }]}
      />
    </div>
  )
}
