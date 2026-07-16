import { Card } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { baseColors } from '@/theme/colors'
import type { DashboardStat } from '../types'

interface DashboardStatCardProps {
  stat: DashboardStat
}

export function DashboardStatCard({ stat }: DashboardStatCardProps) {
  const Icon = stat.icon
  const tileId = `stat-${stat.id}-tile`

  return (
    <Tile id={tileId} layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="card-hover group flex flex-row items-center justify-between px-4 py-3 gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-body-muted text-muted-foreground truncate">{stat.label}</span>
          <span
            className="text-numeric text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--heading)' }}
          >
            {stat.value.toLocaleString('en-IN')}
          </span>
        </div>
        <div
          className="flex items-center justify-center size-[48px] min-w-[48px] rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: stat.iconBg }}
        >
          <Icon className="size-[22px]" style={{ color: stat.iconColor }} />
        </div>
      </Card>
    </Tile>
  )
}
