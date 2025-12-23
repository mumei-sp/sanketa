import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'

export default function FeesCollection() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fees Collection"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Fees Collection' },
        ]}
        onBack={() => navigate('/finance')}
      />
    </div>
  )
}
