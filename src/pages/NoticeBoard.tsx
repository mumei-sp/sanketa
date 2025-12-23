import PageHeader from '@/components/layout/PageHeader'

export default function NoticeBoard() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Notice Board"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Notice Board' },
        ]}
      />
    </div>
  )
}
