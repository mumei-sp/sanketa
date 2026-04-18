import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
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
import { fontWeights } from '@/config/typography'
import { Tile, type ResponsiveValue } from '@/components/tile'
import type { AttendanceData } from '@/data/dashboard'
import { colors } from '@/theme/colors'
import { ChartGradient } from '@/theme/ChartGradient'

interface AttendanceOverviewChartProps {
  data: AttendanceData[]
  isLoading?: boolean
  tileWidth?: ResponsiveValue<number>
  tileLayoutMode?: 'grid' | 'block'
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
 * Custom tooltip component for attendance overview chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-2 py-1.5">
        <p className="text-badge text-heading">
          {`${payload[0].payload.day}: ${payload[0].value.toLocaleString('en-IN')}`}
        </p>
      </div>
    )
  }
  return null
}

/**
 * Custom label component to display values above bars
 */
const CustomLabel = ({ x, y, width, value }: any) => {
  // Calculate the center of the bar: x + (width / 2)
  const centerX = x + width / 2

  return (
    <text
      x={centerX}
      y={y}
      fill={'var(--heading)'}
      textAnchor="middle"
      fontSize={12}
      fontWeight={fontWeights.medium}
      dy={-8}
    >
      {value.toLocaleString('en-IN')}
    </text>
  )
}

/**
 * Custom bar shape with rounded corners, top stroke, and gradient fill
 */
const CustomBar = (props: any) => {
  const { x, y, width, height } = props
  const radius = 4

  if (height <= 0) return <g />

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="url(#attendanceGradient)"
        rx={radius}
        ry={radius}
      />
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={'var(--heading)'} strokeWidth={1.5} />
    </g>
  )
}

/**
 * AttendanceOverviewChart - Displays daily attendance as a bar chart
 */
export function AttendanceOverviewChart({
  data,
  isLoading = false,
  tileWidth,
  tileLayoutMode = 'block',
}: AttendanceOverviewChartProps) {
  const [timeRange, setTimeRange] = React.useState('this-week')

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    let filtered: AttendanceData[]
    switch (timeRange) {
      case 'this-week':
        filtered = data.slice(-7)
        break
      case 'last-week':
        filtered = data.slice(-14, -7)
        break
      default:
        filtered = data.slice(-7)
    }

    // Remove Sunday from the filtered data
    return filtered.filter(item => item.day !== 'Sun')
  }, [data, timeRange])

  // Calculate the rounded max value for Y-axis domain
  const yAxisMax = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 1000
    const maxAttendance = Math.max(...filteredData.map(d => d.attendance))
    return calculateRoundMax(maxAttendance)
  }, [filteredData])

  if (isLoading) {
    return (
      <Tile
        id="attendance-overview-tile"
        layoutMode={tileLayoutMode}
        width={tileWidth}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="pt-4 pb-2">
          <CardHeader>
            <h3 className="text-section-title">Attendance Overview</h3>
            <CardAction>
              <Skeleton className="h-9 w-[110px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2 pb-1">
            <Skeleton className="h-[204px] w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="attendance-overview-tile"
      layoutMode={tileLayoutMode}
      width={tileWidth}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="pt-4 pb-2">
        <CardHeader>
          <h3 className="text-section-title">Attendance Overview</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-1">
          <div className="chart-scale">
            <ResponsiveContainer width="100%" height={204}>
              <BarChart data={filteredData} margin={{ top: 10, right: 0, left: 4, bottom: 0 }}>
                <defs>
                  <ChartGradient id="attendanceGradient" />
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border.default}
                  opacity={0.3}
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="day"
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
                <Bar
                  dataKey="attendance"
                  shape={CustomBar}
                  fill={'var(--primary)'}
                  activeBar={false}
                >
                  <LabelList content={<CustomLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
