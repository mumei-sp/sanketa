import { Ellipsis } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'
import type { FeeProgressData } from '../types'

interface FeeCollectionProgressProps {
  data: FeeProgressData[]
  isLoading?: boolean
}

function ProgressCard({ item }: { item: FeeProgressData }) {
  return (
    <Card className="px-4 py-4 flex flex-col gap-2.5">
      {/* Category + Percentage */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-base font-bold min-w-0 break-words"
          style={{ color: 'var(--heading)' }}
          title={item.category}
        >
          {item.category}
        </span>
        <span
          className="text-base font-extrabold flex-shrink-0"
          style={{ color: 'var(--heading)' }}
        >
          {item.percentage}%
        </span>
      </div>

      {/* Progress bar — thick, track uses brand pink */}
      <div
        className="h-3 w-full rounded-full"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${item.percentage}%`,
            backgroundColor: item.color,
          }}
        />
      </div>

      {/* Collected / Total */}
      <span className="text-sm text-muted-foreground">
        <span className="font-extrabold" style={{ color: 'var(--heading)' }}>
          ₹{item.collected.toLocaleString('en-IN')}
        </span>
        {' / ₹'}{item.total.toLocaleString('en-IN')} collected
      </span>
    </Card>
  )
}

export function FeeCollectionProgress({ data, isLoading = false }: FeeCollectionProgressProps) {
  if (isLoading) {
    return (
      <Tile
        id="fee-progress-tile"
        layoutMode="block"
        background="transparent"
        padding={0}
        shadowed={false}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="px-5 py-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-[120px]" />
            </Card>
          ))}
        </div>
      </Tile>
    )
  }

  return (
    <Tile
      id="fee-progress-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
      className="h-full flex flex-col"
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-section-title">Fees Collection Progress</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </div>

      {/* 2×2 grid of individual progress cards */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {data.map(item => (
          <ProgressCard key={item.category} item={item} />
        ))}
      </div>
    </Tile>
  )
}
