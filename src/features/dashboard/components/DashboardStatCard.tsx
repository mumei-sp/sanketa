import { Card } from '@/components/ui/card'
import { PanelTile } from '@/components/tile'
import { CountUp } from '@/components/shared/CountUp'
import type { DashboardStat } from '../types'

interface DashboardStatCardProps {
  stat: DashboardStat
}

export function DashboardStatCard({ stat }: DashboardStatCardProps) {
  const Icon = stat.icon
  const tileId = `stat-${stat.id}-tile`

  return (
    <PanelTile id={tileId}>
      <Card className="card-hover group flex flex-row items-center justify-between px-3 py-3 gap-2.5 sm:px-4 sm:gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Two KPI cards sit side by side on a phone, so the label wraps
              rather than clipping to "Enrolled Stu…". */}
          <span className="text-body-muted text-muted-foreground line-clamp-2">{stat.label}</span>
          <span
            className="text-numeric text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--heading)' }}
          >
            <CountUp value={stat.value} />
          </span>
        </div>
        {/* A flat squircle in the tile's own tint.
            It was a 135° gradient with a coloured glow beneath it, and neither
            is in the design language — across every artboard an icon plate is
            one solid tint. The gradient also mixed toward a literal `white`,
            which in dark mode turned `--heading` (oklch 0.96) into a near-white
            plate throwing a white glow onto an oklch 0.205 card. */}
        <div
          className="flex items-center justify-center size-10 min-w-10 sm:size-[46px] sm:min-w-[46px] rounded-lg flex-shrink-0"
          style={{ backgroundColor: stat.iconBg }}
        >
          <Icon className="size-5 sm:size-[22px]" style={{ color: stat.iconColor }} />
        </div>
      </Card>
    </PanelTile>
  )
}
