import * as React from 'react'
import {
  AreaChart,
  Area,
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
import type { EarningsDataset } from '../types'

interface EarningsChartProps {
  datasets: EarningsDataset[]
  isLoading?: boolean
}

const MIN_WIDTH_PER_ITEM = 60

const formatYAxis = (value: number) => {
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value.toLocaleString('en-IN')}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold mb-1" style={{ color: baseColors.heading }}>{label}</p>
        {payload.map((entry: any) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 text-xs"
            style={{ color: baseColors.heading }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span>{entry.name}:</span>
            <span className="font-semibold">₹{entry.value.toLocaleString('en-IN')}</span>
          </div>
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
            className="w-4 h-0.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-caption text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function EarningsChart({ datasets, isLoading = false }: EarningsChartProps) {
  const [selected, setSelected] = React.useState('')

  // Sync selected to first dataset when datasets load
  React.useEffect(() => {
    if (datasets.length > 0 && !selected) {
      setSelected(datasets[0].value)
    }
  }, [datasets, selected])

  const { startMonth } = useAcademicDates()
  const activeDataset = datasets.find(d => d.value === selected) ?? datasets[0]
  const rawData = activeDataset?.data ?? []
  const data = React.useMemo(
    () => reorderByAcademicMonth(rawData, 'month', startMonth),
    [rawData, startMonth],
  )
  const chartMinWidth = data.length * MIN_WIDTH_PER_ITEM
  const needsScroll = chartMinWidth > 400

  if (isLoading || !activeDataset) {
    return (
      <Tile id="earnings-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="w-full h-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Earnings</h3>
            <CardAction><Skeleton className="h-9 w-[120px]" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1"><Skeleton className="h-[220px] w-full" /></CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="earnings-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Earnings</h3>
          <CardAction>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-[120px] bg-accent">
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
          <div className={`h-full ${needsScroll ? 'overflow-x-auto' : ''}`}>
            <div className="chart-scale h-full" style={needsScroll ? { minWidth: chartMinWidth } : undefined}>
              <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={baseColors.heading} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={baseColors.heading} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={baseColors.pink} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={baseColors.pink} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.default} opacity={0.3} vertical={false} />
                  <XAxis dataKey="month" stroke={colors.text.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    width={44}
                    stroke={colors.text.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                    domain={[0, 'auto']}
                    tickCount={5}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend content={<CustomLegend />} verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8 }} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    name="Earnings"
                    stroke={baseColors.heading}
                    strokeWidth={2}
                    fill="url(#earningsFill)"
                    dot={{ r: 3, fill: baseColors.heading, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: baseColors.heading, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke={baseColors.pink}
                    strokeWidth={2}
                    fill="url(#expensesFill)"
                    dot={{ r: 3, fill: baseColors.pink, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: baseColors.pink, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
