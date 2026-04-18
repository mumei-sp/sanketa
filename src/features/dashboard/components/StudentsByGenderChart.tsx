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
import { Tile } from '@/components/tile'
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
    const filtered = datasets.filter(ds =>
      pickedGrades.some(g => ds.value === `grade-${g}`),
    )
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

  if (isLoading || !activeDataset) {
    return (
      <Tile id="gender-chart-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="w-full h-full pt-4 pb-4 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Students by Gender</h3>
            <CardAction><Skeleton className="h-9 w-[100px]" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1"><Skeleton className="h-[180px] w-full" /></CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="gender-chart-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="group/chart w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Students by Gender</h3>
          <CardAction>
            <div className="flex items-center gap-2">
              <div className="opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200">
                <ClassPicker
                  storageKey="dash-gender"
                  mode="grade"
                  max={3}
                  onChange={setPickedGrades}
                />
              </div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-[100px] bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredDatasets.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[160px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
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
                <span
                  className="text-2xl font-bold"
                  style={{ color: 'var(--heading)' }}
                >
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
    </Tile>
  )
}
