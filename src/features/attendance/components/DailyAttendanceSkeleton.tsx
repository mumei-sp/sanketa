import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'

/**
 * Skeleton loading state for the Daily Attendance page.
 * Mimics the toolbar, status banner, and marking table layout
 * to provide visual continuity while data loads.
 */
export function DailyAttendanceSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <Tile
        id="toolbar-skeleton"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Class selector */}
            <Skeleton className="h-8 w-[110px] rounded-md" />
            {/* Date picker */}
            <Skeleton className="h-8 w-[140px] rounded-md" />
            {/* Mark All button */}
            <Skeleton className="h-8 w-[140px] rounded-md" />
          </div>
          {/* View toggle */}
          <Skeleton className="h-8 w-[140px] rounded-md" />
        </div>
      </Tile>

      {/* Status banner skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Table skeleton (desktop) */}
      <Tile
        id="table-skeleton"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
      >
        <div className="space-y-3">
          {/* Table header */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 flex-1" />
          </div>

          {/* Divider */}
          <Skeleton className="h-px w-full" />

          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1">
              <Skeleton className="h-4 w-[30px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-4 w-[40px]" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-[42px] rounded-md" />
                <Skeleton className="h-7 w-[42px] rounded-md" />
                <Skeleton className="h-7 w-[42px] rounded-md" />
              </div>
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Tile>

      {/* Summary bar skeleton */}
      <Tile
        id="summary-skeleton"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[70px]" />
            <Skeleton className="h-4 w-[90px]" />
          </div>
          <Skeleton className="h-9 w-[140px] rounded-lg" />
        </div>
      </Tile>
    </div>
  )
}

/**
 * Skeleton for the history table view.
 */
export function DailyAttendanceHistorySkeleton() {
  return (
    <Tile
      id="history-skeleton"
      layoutMode="block"
      background="card"
      borderRadius="lg"
      shadowed={false}
      padding="p-6"
    >
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[50px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
        <Skeleton className="h-px w-full" />

        {/* Rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 py-1">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-7 w-[60px] rounded-md" />
          </div>
        ))}
      </div>
    </Tile>
  )
}
