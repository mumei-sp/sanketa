import PageHeader from '@/components/layout/PageHeader'

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
    </div>
  )
}
