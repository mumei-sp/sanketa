import * as React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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
import { colors, baseColors } from '@/theme/colors'
import { ChartGradient } from '@/theme/ChartGradient'
import type { FeeTrendData } from '../types'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import { reorderByAcademicMonth } from '@/utils/academic-date'

interface FeeCollectionTrendProps {
  data: FeeTrendData[]
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
        <p className="text-xs font-semibold" style={{ color: baseColors.heading }}>
          {data.month} 2035
        </p>
        <p className="text-sm font-bold" style={{ color: baseColors.heading }}>
          ₹{data.amount.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export function FeeCollectionTrend({ data, isLoading = false }: FeeCollectionTrendProps) {
  const [timeRange, setTimeRange] = React.useState('last-6-months')
  const { startMonth } = useAcademicDates()

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const sliceCount = timeRange === 'last-3-months' ? 3
      : timeRange === 'last-6-months' ? 6
      : timeRange === 'last-8-months' ? 8
      : undefined // last-12-months = all

    return reorderByAcademicMonth(data, 'month', startMonth, sliceCount)
  }, [data, timeRange, startMonth])

  const yAxisMax = React.useMemo(() => {
    if (filteredData.length === 0) return 100000
    const maxVal = Math.max(...filteredData.map(d => d.amount))
    return Math.ceil(maxVal / 10000) * 10000
  }, [filteredData])

  if (isLoading) {
    return (
      <Tile
        id="fee-trend-tile"
        layoutMode="block"
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="w-full pt-4 pb-2 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Fees Collection Trend</h3>
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
      id="fee-trend-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
      className="h-full"
    >
      <Card className="w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Fees Collection Trend</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-8-months">Last 8 Months</SelectItem>
                <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4 flex-1 min-h-0">
          <div className="chart-scale h-full min-h-[204px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={timeRange}
                data={filteredData}
                margin={{ top: 20, right: 10, left: 4, bottom: 8 }}
              >
                <defs>
                  <ChartGradient
                    id="feeTrendGradient"
                    color={baseColors.heading}
                    topOpacity={0.3}
                    bottomOpacity={0.05}
                  />
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
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={baseColors.heading}
                  strokeWidth={2}
                  fill="url(#feeTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
