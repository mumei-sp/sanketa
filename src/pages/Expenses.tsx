import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'

export default function Expenses() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Expenses' },
        ]}
        onBack={() => navigate('/finance')}
      />
    </div>
  )
}
