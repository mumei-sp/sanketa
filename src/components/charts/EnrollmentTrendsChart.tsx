import * as React from 'react'
import {
  AreaChart,
  Area,
  Line,
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
import { Tile, type ResponsiveValue } from '@/components/tile'
import type { EnrollmentData } from '@/data/dashboard'
import { colors } from '@/theme/colors'
import { ChartGradient } from '@/theme/ChartGradient'

interface EnrollmentTrendsChartProps {
  data: EnrollmentData[]
  isLoading?: boolean
  tileWidth?: ResponsiveValue<number>
  tileLayoutMode?: 'grid' | 'block'
}

/**
 * Custom tooltip component for enrollment trends chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-2 py-1.5 shadow-sm">
        <p className="text-badge text-heading">{`Year: ${payload[0].payload.year}`}</p>
        <p className="text-xs text-heading">{`Enrollment: ${payload[0].value.toLocaleString('en-IN')}`}</p>
      </div>
    )
  }
  return null
}

/**
 * Format Y-axis values with K notation
 */
const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `${value / 1000}K`
  }
  return value.toString()
}

/**
 * Calculate the next closest round value for Y-axis max
 * Rounds up to the next nice round number based on the magnitude
 * Examples: 8015 -> 10000, 13000 -> 15000, 1760 -> 2000, 5500 -> 6000
 */
const calculateRoundMax = (maxValue: number): number => {
  if (maxValue <= 0) return 1000

  // Get the order of magnitude (1000, 10000, etc.)
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))

  // Get the normalized value (first 1-2 digits)
  const normalized = maxValue / magnitude

  // Round up to next nice number: 1.5, 2, 3, 5, or 10
  let multiplier: number
  if (normalized <= 1.5) {
    multiplier = 1.5
  } else if (normalized <= 2) {
    multiplier = 2
  } else if (normalized <= 3) {
    multiplier = 3
  } else if (normalized <= 5) {
    multiplier = 5
  } else if (normalized <= 10) {
    multiplier = 10
  } else {
    // If already above 10, go to next magnitude
    return 10 * magnitude * 10
  }

  const nextRound = multiplier * magnitude

  // If the value is very close to the round number (within 95%), go to next step
  if (maxValue >= nextRound * 0.95) {
    if (multiplier === 1.5) {
      return 2 * magnitude
    } else if (multiplier === 2) {
      return 3 * magnitude
    } else if (multiplier === 3) {
      return 5 * magnitude
    } else if (multiplier === 5) {
      return 10 * magnitude
    } else {
      return 10 * magnitude * 10
    }
  }

  return nextRound
}

/**
 * EnrollmentTrendsChart - Displays enrollment trends over years as an area + line chart
 */
export function EnrollmentTrendsChart({
  data,
  isLoading = false,
  tileWidth,
  tileLayoutMode = 'block',
}: EnrollmentTrendsChartProps) {
  const [timeRange, setTimeRange] = React.useState('last-5-years')

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Sort data by year to ensure correct order
    const sortedData = [...data].sort((a, b) => a.year - b.year)

    switch (timeRange) {
      case 'last-year':
        return sortedData.slice(-1)
      case 'last-3-years':
        return sortedData.slice(-3)
      case 'last-5-years':
        return sortedData.slice(-5)
      default:
        return sortedData.slice(-5)
    }
  }, [data, timeRange])

  // Calculate the rounded max value for Y-axis domain
  const yAxisMax = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 1000
    const maxEnrollment = Math.max(...filteredData.map(d => d.enrollment))
    return calculateRoundMax(maxEnrollment)
  }, [filteredData])

  if (isLoading) {
    return (
      <Tile
        id="enrollment-trends-tile"
        layoutMode={tileLayoutMode}
        width={tileWidth}
        background="transparent"
        padding={0}
        shadowed={false}
        style={{ height: '100%' }}
      >
        <Card className="pt-6 pb-0 h-full">
          <CardHeader>
            <h3 className="text-section-title">Enrollment Trends</h3>
            <CardAction>
              <Skeleton className="h-9 w-[110px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <Skeleton className="h-[170px] w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="enrollment-trends-tile"
      layoutMode={tileLayoutMode}
      width={tileWidth}
      background="transparent"
      padding={0}
      shadowed={false}
      style={{ height: '100%' }}
    >
      <Card className="pt-6 pb-0 h-full">
        <CardHeader>
          <h3 className="text-section-title">Enrollment Trends</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="last-3-years">Last 3 Years</SelectItem>
                <SelectItem value="last-5-years">Last 5 Years</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4">
          <div className="chart-scale">
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: 4, bottom: 8 }}>
                <defs>
                  <ChartGradient id="enrollmentGradient" />
                </defs>
                <CartesianGrid
                  stroke={colors.border.default}
                  opacity={0.3}
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="year"
                  padding={{ left: 0, right: 0 }}
                  stroke={colors.text.muted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={36}
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
                  dataKey="enrollment"
                  stroke="none"
                  fill="url(#enrollmentGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="enrollment"
                  stroke={colors.text.heading}
                  strokeWidth={1.75}
                  dot={false}
                  activeDot={{ r: 4, fill: colors.text.heading }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
