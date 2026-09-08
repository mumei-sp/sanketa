/**
 * Shown when a route exists but the signed-in role cannot open it.
 *
 * A page rather than a silent redirect to the dashboard. Being bounced without
 * explanation reads as a bug — people retry, then report it — where naming the
 * rule and the role reads as a decision someone made, and tells whoever is
 * standing behind them exactly what to ask an admin for.
 */

import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { usePermissions } from '@/features/auth/PermissionContext'

export default function Forbidden() {
  const navigate = useNavigate()
  const { role } = usePermissions()

  return (
    <EmptyState
      icon={<ShieldOff />}
      title="You don't have access to this page"
      description={
        role
          ? `Your role, ${role.name}, doesn't include this area. An administrator can change that in Settings → Access.`
          : 'Your account has no role assigned. An administrator can assign one in Settings → Access.'
      }
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/')}>Go to dashboard</Button>
        </div>
      }
      className="py-20"
    />
  )
}
