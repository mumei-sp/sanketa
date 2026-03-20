import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, accent, border } from '@/theme/colors'
import type { LeaveRequest } from '../types/teacher-detail'

interface TeacherLeaveRequestProps {
  leaveRequests: LeaveRequest[]
}

/**
 * TeacherLeaveRequest - Displays pending leave requests with approve/decline actions
 */
export function TeacherLeaveRequest({ leaveRequests }: TeacherLeaveRequestProps) {
  const pendingRequests = leaveRequests.filter(lr => lr.status === 'Pending')

  if (!pendingRequests.length) return null

  const request = pendingRequests[0]

  return (
    <SectionCard
      title="Leave Request"
      action={
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        {/* Leave type badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            padding: `${spacing['0.5']} ${spacing['2.5']}`,
            borderRadius: '999rem',
            fontSize: fontSizes.xs,
            fontWeight: 500,
            backgroundColor: accent.base,
            color: text.heading,
          }}
        >
          {request.type}
        </span>

        {/* Reason */}
        <p
          style={{
            fontSize: fontSizes.sm,
            color: text.body,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {request.reason}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            style={{
              fontSize: fontSizes.xs,
              borderColor: border.default,
            }}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            style={{
              fontSize: fontSizes.xs,
              borderColor: border.default,
            }}
          >
            Decline
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
