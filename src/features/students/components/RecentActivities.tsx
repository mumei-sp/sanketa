import { UserPlus, TrendingUp, Clock, ArrowUpRight, ArrowRightLeft } from 'lucide-react'
import { text, border, baseColors, withOpacity } from '@/theme/colors'
import { recentActivitiesData, type ActivityType } from '@/data/mocks/student-recent-activities'

const ACTIVITY_CONFIG: Record<ActivityType, { icon: typeof UserPlus; bg: string; color: string }> = {
  enrollment: { icon: UserPlus, bg: withOpacity(baseColors.blue, 0.35), color: baseColors.heading },
  grade: { icon: TrendingUp, bg: withOpacity('#C7E5C8', 0.5), color: '#3A7D44' },
  attendance: { icon: Clock, bg: withOpacity(baseColors.pink, 0.35), color: '#8B2B6E' },
  promotion: { icon: ArrowUpRight, bg: withOpacity(baseColors.blue, 0.35), color: baseColors.heading },
  transfer: { icon: ArrowRightLeft, bg: withOpacity('#FFE5B4', 0.5), color: '#926C2D' },
}

export function RecentActivities() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: text.heading }}>
          Recent Activities
        </span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {recentActivitiesData.map((entry, i) => {
          const config = ACTIVITY_CONFIG[entry.type]
          const Icon = config.icon
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingBottom: i < recentActivitiesData.length - 1 ? 10 : 0,
                borderBottom: i < recentActivitiesData.length - 1 ? `1px solid ${border.subtle}` : 'none',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  backgroundColor: config.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={15} style={{ color: config.color }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: text.heading, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.description}
                </div>
                <div style={{ fontSize: 11, color: text.muted, marginTop: 1 }}>
                  {entry.studentName} · {entry.classLabel}
                </div>
              </div>

              {/* Time */}
              <span style={{ fontSize: 10, color: text.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {entry.timeAgo}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
