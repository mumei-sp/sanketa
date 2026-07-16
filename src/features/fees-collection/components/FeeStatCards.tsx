import { Card } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { baseColors, text } from '@/theme/colors'
import type { FeeStat } from '../types'

interface FeeStatCardsProps {
  stats: FeeStat[]
  isLoading?: boolean
}

export function FeeStatCards({ stats, isLoading = false }: FeeStatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
        {[...Array(3)].map((_, i) => (
          <Tile
            key={i}
            id={`fee-stat-skeleton-${i}`}
            layoutMode="block"
            background="transparent"
            padding={0}
            shadowed={false}
          >
            <Card className="flex flex-col md:flex-row items-center gap-3 px-3 md:px-4 py-3">
              <Skeleton className="size-[40px] md:size-[52px] rounded-xl" />
              <div className="flex flex-col gap-1.5 items-center md:items-start">
                <Skeleton className="h-6 md:h-7 w-[70px] md:w-[100px]" />
                <Skeleton className="h-3 w-[60px] md:w-[80px]" />
              </div>
            </Card>
          </Tile>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-1 gap-3 h-full">
      {stats.map(stat => {
        const Icon = stat.icon
        const tileId = `fee-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}-tile`

        return (
          <Tile
            key={stat.label}
            id={tileId}
            layoutMode="block"
            background="transparent"
            padding={0}
            shadowed={false}
          >
            <Card className="card-hover flex flex-col md:flex-row items-center gap-3 px-3 md:px-4 py-3">
              {/* Icon — square with rounded corners */}
              <div
                className="flex items-center justify-center size-[40px] md:size-[52px] min-w-[40px] md:min-w-[52px] rounded-xl flex-shrink-0"
                style={{ backgroundColor: stat.iconBg }}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: stat.iconColor }} />
              </div>
              {/* Value + Label */}
              <div className="flex flex-col gap-0.5 min-w-0 items-center md:items-start">
                <span
                  className="text-numeric text-lg md:text-[26px] font-extrabold leading-tight tracking-tight"
                  style={{ color: 'var(--heading)' }}
                >
                  ₹{stat.value.toLocaleString('en-IN')}
                </span>
                <span
                  className="text-[10px] md:text-[13px] font-medium truncate"
                  style={{ color: text.muted }}
                >
                  {stat.label}
                </span>
              </div>
            </Card>
          </Tile>
        )
      })}
    </div>
  )
}
