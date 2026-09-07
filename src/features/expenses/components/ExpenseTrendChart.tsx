import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
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
import { colors } from '@/theme/colors'
import { ChartGradient } from '@/theme/ChartGradient'
import type { ExpenseTrendData } from '../types'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import { reorderByAcademicMonth } from '@/utils/academic-date'

interface ExpenseTrendChartProps {
  data: ExpenseTrendData[]
  isLoading?: boolean
}

const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `₹${(value / 1000).toLocaleString('en-IN')}K`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>
          {data.month} {new Date().getFullYear()}
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--heading)' }}>
          ₹{data.amount.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

const CustomBar = (props: any) => {
  const { x, y, width, height, isActive } = props
  const radius = 4

  if (height <= 0) return <g />

  // Hovered bar uses solid heading color; default uses gradient
  const barFill = isActive ? 'var(--heading)' : 'url(#expenseTrendGradient)'

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={barFill}
      rx={radius}
      ry={radius}
    />
  )
}

/** Active (hovered) bar shape — passes isActive flag to CustomBar */
const ActiveBar = (props: any) => <CustomBar {...props} isActive />

export function ExpenseTrendChart({ data, isLoading = false }: ExpenseTrendChartProps) {
  const [timeRange, setTimeRange] = React.useState('last-8-months')
  const { startMonth } = useAcademicDates()

  /** Reorder data by academic year, then slice to selected range */
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const sliceCount = timeRange === 'last-6-months' ? 6
      : timeRange === 'last-12-months' ? undefined
      : 8 // last-8-months default

    return reorderByAcademicMonth(data, 'month', startMonth, sliceCount)
  }, [data, timeRange, startMonth])

  const average = React.useMemo(() => {
    if (filteredData.length === 0) return 0
    return Math.round(filteredData.reduce((sum, d) => sum + d.amount, 0) / filteredData.length)
  }, [filteredData])

  const yAxisMax = React.useMemo(() => {
    if (filteredData.length === 0) return 20000
    const maxVal = Math.max(...filteredData.map(d => d.amount))
    return Math.ceil(maxVal / 5000) * 5000
  }, [filteredData])

  if (isLoading) {
    return (
      <Tile
        id="expense-trend-tile"
        layoutMode="block"
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="w-full pt-4 pb-2 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Expense Trend</h3>
            <CardAction>
              <Skeleton className="h-9 w-[140px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4">
            <Skeleton className="h-[204px] w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="expense-trend-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Expense Trend</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-8-months">Last 8 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 flex-1 min-h-0">
          <div className="chart-scale h-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={180}>
              <BarChart key={timeRange} data={filteredData} margin={{ top: 20, right: 10, left: 4, bottom: 0 }}>
                <defs>
                  <ChartGradient id="expenseTrendGradient" color={'var(--primary)'} topOpacity={0.8} bottomOpacity={0.3} />
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border.default}
                  opacity={0.3}
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="month"
                  stroke={colors.text.muted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={44}
                  stroke={colors.text.muted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  domain={[0, yAxisMax]}
                  tickCount={5}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <ReferenceLine
                  y={average}
                  stroke={'var(--heading)'}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `₹${average.toLocaleString('en-IN')}`,
                    position: 'right',
                    fill: 'var(--heading)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="amount"
                  shape={CustomBar}
                  isAnimationActive={false}
                  fill={'var(--primary)'}
                  activeBar={<ActiveBar />}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
