import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
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
import { baseColors, colors } from '@/theme/colors'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import { reorderByAcademicMonth } from '@/utils/academic-date'
import type { PerformanceDataset } from '../types'

interface StudentPerformanceChartProps {
  datasets: PerformanceDataset[]
  isLoading?: boolean
}

const MIN_WIDTH_PER_ITEM = 80

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold mb-1" style={{ color: baseColors.heading }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null
  return (
    <div className="flex items-center gap-4 ml-8">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-caption text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function StudentPerformanceChart({ datasets, isLoading = false }: StudentPerformanceChartProps) {
  const [selected, setSelected] = React.useState('')

  // Sync selected to first dataset when datasets load
  React.useEffect(() => {
    if (datasets.length > 0 && !selected) {
      setSelected(datasets[0].value)
    }
  }, [datasets, selected])

  const { startMonth } = useAcademicDates()
  const activeDataset = datasets.find(d => d.value === selected) ?? datasets[0]
  const grades = activeDataset?.grades ?? []
  const rawData = activeDataset?.data ?? []
  const data = React.useMemo(
    () => reorderByAcademicMonth(rawData, 'month', startMonth),
    [rawData, startMonth],
  )
  const chartMinWidth = data.length * MIN_WIDTH_PER_ITEM
  const needsScroll = chartMinWidth > 300

  if (isLoading || !activeDataset) {
    return (
      <Tile id="student-performance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="w-full h-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Student Performance</h3>
            <CardAction><Skeleton className="h-9 w-[140px]" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1"><Skeleton className="h-[220px] w-full" /></CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="student-performance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="w-full h-full pt-4 pb-4 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Student Performance</h3>
          <CardAction>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-[140px] bg-accent">
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
          <div className={needsScroll ? 'overflow-x-auto' : ''}>
            <div className="chart-scale" style={needsScroll ? { minWidth: chartMinWidth } : undefined}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.default} opacity={0.3} vertical={false} />
                  <XAxis dataKey="month" stroke={colors.text.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    width={36}
                    stroke={colors.text.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[0, 100]}
                    tickCount={6}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend content={<CustomLegend />} verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8 }} />
                  {grades.map(g => (
                    <Bar key={g.key} dataKey={g.key} name={g.label} fill={g.color} barSize={18} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
