import PageHeader from '@/components/layout/PageHeader'

export default function Teachers() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Teachers' }]}
      />
    </div>
  )
}
