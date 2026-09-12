import * as React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { PanelTile, PANEL_SELECT_TRIGGER } from '@/components/tile'
import { useBrandColors } from '@/hooks/use-brand-colors'
import { ClassPicker } from '@/components/shared/ClassPicker'
import type { GenderDataset } from '../types'

interface StudentsByGenderChartProps {
  datasets: GenderDataset[]
  isLoading?: boolean
}

export function StudentsByGenderChart({ datasets, isLoading = false }: StudentsByGenderChartProps) {
  const [selected, setSelected] = React.useState('')
  const [pickedGrades, setPickedGrades] = React.useState<string[]>([])

  // Filter datasets to the grades picked via ClassPicker. Fallback to the
  // first 3 grades (matches ClassPicker's default max=3) rather than the
  // full admin-configured list — otherwise the grade dropdown shows every
  // grade 1–10, which is noisy for what's meant to be a single-grade donut.
  const filteredDatasets = React.useMemo(() => {
    const filtered = datasets.filter(ds => pickedGrades.some(g => ds.value === `grade-${g}`))
    if (filtered.length > 0) return filtered
    return datasets.slice(0, 3)
  }, [datasets, pickedGrades])

  React.useEffect(() => {
    if (filteredDatasets.length > 0 && !filteredDatasets.find(d => d.value === selected)) {
      setSelected(filteredDatasets[0].value)
    }
  }, [filteredDatasets, selected])

  const activeDataset = filteredDatasets.find(d => d.value === selected) ?? filteredDatasets[0]
  const rawData = activeDataset?.data ?? []
  const brand = useBrandColors()
  // Re-tint pie slices with live brand colors so preset changes propagate.
  // Boys = heading (dark), Girls = primary (soft), third+ falls back to accent.
  const sliceColors = [brand.heading, brand.primary, brand.accent]
  const data = React.useMemo(
    () => rawData.map((d, i) => ({ ...d, color: sliceColors[i % sliceColors.length] })),
    [rawData, brand.heading, brand.primary, brand.accent],
  )
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  // Loading and empty are different answers, and rendering the skeleton for
  // both meant a dataset that arrived empty span forever. Say so once instead.
  if (!isLoading && !activeDataset) {
    return (
      <PanelTile id="gender-chart-tile-empty">
        <Card className="w-full h-full pt-4 pb-4 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Students by Gender</h3>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1 flex items-center justify-center">
            <EmptyState
              title="No students yet"
              description="The split appears once students are enrolled."
              className="py-8"
            />
          </CardContent>
        </Card>
      </PanelTile>
    )
  }

  if (isLoading || !activeDataset) {
    return (
      <PanelTile id="gender-chart-tile">
        <Card className="w-full h-full pt-4 pb-4 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Students by Gender</h3>
            <CardAction data-compact>
              <Skeleton className="h-8 w-[86px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1">
            <Skeleton className="h-[180px] w-full" />
          </CardContent>
        </Card>
      </PanelTile>
    )
  }

  return (
    <PanelTile id="gender-chart-tile">
      <Card className="group/chart w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Students by Gender</h3>
          <CardAction data-compact>
            <div className="flex items-center gap-1.5">
              <div className="opacity-100 lg:opacity-0 lg:group-hover/chart:opacity-100 transition-opacity duration-200">
                <ClassPicker
                  storageKey="dash-gender"
                  mode="grade"
                  max={3}
                  onChange={setPickedGrades}
                />
              </div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className={cn(PANEL_SELECT_TRIGGER, 'w-[86px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredDatasets.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0">
          {/*
            The donut takes the height it is given rather than a fixed 160px
            square. Locked to 160 it left 62px of void under the legend
            whenever the row was taller than this panel needed — which is most
            of the time, since the row is sized by whichever panel in it is
            tallest. Radii are percentages for the same reason: recharts reads
            them against min(width, height), so the ring grows with the card
            instead of sitting in the middle of it.
          */}
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="relative w-full min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%" minHeight={130}>
                <PieChart>
                  <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="84%"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                    isAnimationActive={false}
                  >
                    {data.map(entry => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: 'var(--heading)' }}>
                  {total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {data.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-caption text-muted-foreground">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </PanelTile>
  )
}
