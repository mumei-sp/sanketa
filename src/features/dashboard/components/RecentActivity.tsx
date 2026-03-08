import { Ellipsis, UserPlus, CheckSquare, Receipt, Pencil } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { baseColors } from '@/theme/colors'
import type { RecentActivityItem } from '../types'

const iconMap: Record<string, LucideIcon> = {
  'user-plus': UserPlus,
  'check-square': CheckSquare,
  'receipt': Receipt,
  'pencil': Pencil,
}

interface RecentActivityProps {
  items: RecentActivityItem[]
  isLoading?: boolean
}

export function RecentActivity({ items, isLoading = false }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Tile id="recent-activity-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
        <Card className="pt-4 pb-4 flex flex-col gap-0 h-full">
          <CardHeader className="flex-shrink-0 pb-2">
            <h3 className="text-section-title">Recent Activity</h3>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="recent-activity-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
      <Card className="pt-4 pb-4 flex flex-col gap-0 h-full border-0 shadow-none bg-transparent">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">Recent Activity</h3>
          <CardAction>
            <button className="p-1 rounded-md hover:bg-accent transition-colors">
              <Ellipsis className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 flex-1 min-h-0 overflow-y-auto space-y-5">
          {items.map(item => {
            const Icon = iconMap[item.icon] ?? Pencil
            return (
              <div key={item.id} className="flex gap-3 items-start">
                <div
                  className="rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: item.iconBg, width: 40, height: 40, minWidth: 40 }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium leading-tight" style={{ color: baseColors.heading }}>
                    {item.text}
                  </p>
                  <p className="text-caption text-muted-foreground mt-1">{item.timestamp}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </Tile>
  )
}
