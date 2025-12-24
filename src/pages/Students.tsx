import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

export default function Students() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Students' }]}
        actions={
          <Button onClick={() => navigate('/students/add')}>
            <Plus className="size-4" />
            Add Student
          </Button>
        }
      />
    </div>
  )
}
