import PageHeader from '@/components/layout/PageHeader'

export default function Dashboard() {
  return (
    <div className="page-container space-y-4">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
    </div>
  )
}
