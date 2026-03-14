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
import { baseColors } from '@/theme/colors'
import type { GenderDataset } from '../types'

interface StudentsByGenderChartProps {
  datasets: GenderDataset[]
  isLoading?: boolean
}

export function StudentsByGenderChart({ datasets, isLoading = false }: StudentsByGenderChartProps) {
  const [selected, setSelected] = React.useState('')

  React.useEffect(() => {
    if (datasets.length > 0 && !selected) {
      setSelected(datasets[0].value)
    }
  }, [datasets, selected])

  const activeDataset = datasets.find(d => d.value === selected) ?? datasets[0]
  const data = activeDataset?.data ?? []
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
      <Card className="w-full h-full pt-4 pb-4 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Students by Gender</h3>
          <CardAction>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-[100px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(ds => (
                  <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  style={{ color: baseColors.heading }}
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
