import { Users, Clock, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { baseColors, text, colors } from '@/theme/colors'
import { fontWeights } from '@/config/typography'

interface TeacherStatistics {
  total: number
  fullTime: number
  partTime: number
  substitute: number
}

interface TeachersDashboardProps {
  statistics: TeacherStatistics
}

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-xs p-3 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h3 className="text-body-muted font-medium" style={{ color: text.heading }}>
          {label}
        </h3>
        <span
          className="text-numeric text-2xl"
          style={{ color: text.heading, fontWeight: fontWeights.bold }}
        >
          {value}
        </span>
      </div>
      <div
        className="flex items-center justify-center rounded-full w-12 h-12 shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
    </div>
  )
}

/**
 * Teachers Dashboard Component
 * Displays teacher statistics in a responsive grid
 * Desktop: 4 cols in a row | Tablet/Mobile: 2×2 grid
 */
export function TeachersDashboard({ statistics }: TeachersDashboardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Teachers"
        value={statistics.total}
        icon={Users}
        iconBg={baseColors.heading}
        iconColor={colors.background.card}
      />
      <StatCard
        label="Full-Time Teacher"
        value={statistics.fullTime}
        icon={Clock}
        iconBg={baseColors.pink}
        iconColor={text.heading}
      />
      <StatCard
        label="Part-Time Teacher"
        value={statistics.partTime}
        icon={Clock}
        iconBg={baseColors.blue}
        iconColor={text.heading}
      />
      <StatCard
        label="Substitute Teacher"
        value={statistics.substitute}
        icon={RefreshCw}
        iconBg={baseColors.pink}
        iconColor={text.heading}
      />
    </div>
  )
}
