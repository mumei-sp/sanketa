import { Users, Clock, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { baseColors, text, colors } from '@/theme/colors'
import { fontWeights } from '@/config/typography'
import { TileWrapper, Tile } from '@/components/tile'

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
  id: string
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function StatCard({ id, label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Tile
      id={id}
      background="card"
      borderRadius="lg"
      shadowed
      padding={12}
      className="flex items-center justify-between"
    >
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
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: iconBg, width: 44, height: 44, minWidth: 44, minHeight: 44 }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
    </Tile>
  )
}

/**
 * Teachers Dashboard Component
 * Displays teacher statistics in a responsive grid
 * Desktop: 4 cols in a row | Tablet/Mobile: 2×2 grid
 */
export function TeachersDashboard({ statistics }: TeachersDashboardProps) {
  return (
    <TileWrapper columns={{ default: 2, lg: 4 }} gap={12}>
      <StatCard
        id="stat-total-teachers"
        label="Total Teachers"
        value={statistics.total}
        icon={Users}
        iconBg={baseColors.heading}
        iconColor={colors.background.card}
      />
      <StatCard
        id="stat-full-time"
        label="Full-Time Teacher"
        value={statistics.fullTime}
        icon={Clock}
        iconBg={baseColors.pink}
        iconColor={text.heading}
      />
      <StatCard
        id="stat-part-time"
        label="Part-Time Teacher"
        value={statistics.partTime}
        icon={Clock}
        iconBg={baseColors.blue}
        iconColor={text.heading}
      />
      <StatCard
        id="stat-substitute"
        label="Substitute Teacher"
        value={statistics.substitute}
        icon={RefreshCw}
        iconBg={baseColors.pink}
        iconColor={text.heading}
      />
    </TileWrapper>
  )
}
