import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tile } from '@/components/tile'
import { Edit, Waves, Music2, Bot, Palette, Trophy, BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtracurricularActivity } from '@/features/students/types'

/** Sort column key */
type SortColumn = 'club' | 'achievements' | 'duration' | 'advisor'
/** Sort direction */
type SortDir = 'asc' | 'desc'

/**
 * Parse duration string to a numeric value for sorting.
 * "2029 - Present" or "2033 - Present" → use start year; "Present" treated as high (most recent first).
 */
function getDurationSortValue(duration: string | undefined): number {
  if (!duration?.trim()) return 0
  const parts = duration.split(/\s*-\s*/).map(p => p.trim())
  const start = parts[0]
  if (/^\d{4}$/.test(start)) return parseInt(start, 10)
  return 0
}

export interface ExtracurricularActivitiesProps {
  activities: ExtracurricularActivity[]
  isLoading?: boolean
  tileWidth?: number
  tileLayoutMode?: 'grid' | 'block'
  /** Called when Edit is clicked (e.g. navigate to edit student to add/edit activities) */
  onEdit?: () => void
}

const iconMap = {
  swimming: Waves,
  dance: Music2,
  robotics: Bot,
  music: Music2,
  art: Palette,
  sports: Trophy,
  other: BookOpen,
}

function getActivityIcon(iconKey?: ExtracurricularActivity['iconKey']) {
  const key = iconKey ?? 'other'
  return iconMap[key] ?? iconMap.other
}

/**
 * Extracurricular activities module
 * Displays a table of clubs with: Club (icon + name + role), Achievements, Duration, Advisor
 */
function ExtracurricularCardHeader({ onEdit }: { onEdit?: () => void }) {
  return (
    <CardHeader>
      <h3 className="text-section-title">Extracurricular</h3>
      {onEdit && (
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit extracurricular activities"
            style={{ width: '2rem', height: '2rem' }}
          >
            <Edit style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </CardAction>
      )}
    </CardHeader>
  )
}

export function ExtracurricularActivities({
  activities,
  isLoading = false,
  tileWidth,
  tileLayoutMode = 'block',
  onEdit,
}: ExtracurricularActivitiesProps) {
  const [sort, setSort] = React.useState<{ column: SortColumn; dir: SortDir } | null>(null)

  const handleSort = React.useCallback((column: SortColumn) => {
    setSort(prev => {
      const defaultDir: SortDir = column === 'duration' ? 'desc' : 'asc'
      if (!prev || prev.column !== column) return { column, dir: defaultDir }
      return { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }, [])

  const sortedActivities = React.useMemo(() => {
    if (!sort || !activities.length) return activities
    const { column: sortBy, dir: sortDir } = sort
    const list = [...activities]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'club':
          cmp = (a.club ?? '').localeCompare(b.club ?? '', undefined, { sensitivity: 'base' })
          break
        case 'achievements':
          cmp = (a.achievements ?? '').localeCompare(b.achievements ?? '', undefined, { sensitivity: 'base' })
          break
        case 'duration':
          cmp = getDurationSortValue(a.duration) - getDurationSortValue(b.duration)
          break
        case 'advisor':
          cmp = (a.advisor ?? '').localeCompare(b.advisor ?? '', undefined, { sensitivity: 'base' })
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [activities, sort])

  const SortHeader = ({
    column,
    label,
    className,
  }: {
    column: SortColumn
    label: string
    className?: string
  }) => {
    const active = sort?.column === column
    const dir = sort?.dir
    return (
      <TableHead className={cn('font-semibold', className)}>
        <button
          type="button"
          onClick={() => handleSort(column)}
          className="inline-flex items-center gap-1.5 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
          aria-label={`Sort by ${label}. ${active ? (dir === 'asc' ? 'Ascending. Click for reverse.' : 'Descending. Click for reverse.') : 'Click to sort'}`}
        >
          {label}
          {active ? (
            dir === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          )}
        </button>
      </TableHead>
    )
  }

  if (isLoading) {
    return (
      <Tile
        id="extracurricular-tile"
        layoutMode={tileLayoutMode}
        width={tileWidth}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="pt-6 pb-6">
          <ExtracurricularCardHeader onEdit={onEdit} />
          <CardContent className="px-6">
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Tile
        id="extracurricular-tile"
        layoutMode={tileLayoutMode}
        width={tileWidth}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="pt-6 pb-6">
          <ExtracurricularCardHeader onEdit={onEdit} />
          <CardContent className="px-6">
            <p className="text-sm text-muted-foreground">No extracurricular activities recorded.</p>
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="extracurricular-tile"
      layoutMode={tileLayoutMode}
      width={tileWidth}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="pt-6 pb-6">
        <ExtracurricularCardHeader onEdit={onEdit} />
        <CardContent className="px-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b hover:bg-transparent">
                <SortHeader column="club" label="Club" />
                <SortHeader column="achievements" label="Achievements" />
                <SortHeader column="duration" label="Duration" />
                <SortHeader column="advisor" label="Advisor" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.iconKey)
                return (
                  <TableRow key={`${activity.club}-${index}`}>
                    <TableCell className="align-top">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"
                          aria-hidden
                        >
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{activity.club}</p>
                          {activity.role && (
                            <p className="text-xs text-muted-foreground">{activity.role}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {activity.achievements ?? '—'}
                    </TableCell>
                    <TableCell className="align-top text-sm whitespace-nowrap">
                      {activity.duration}
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {activity.advisor}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tile>
  )
}
