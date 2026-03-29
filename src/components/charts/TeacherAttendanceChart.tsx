import * as React from 'react'
import {
  ComposedChart,
  Bar,
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
import { fontWeights } from '@/config/typography'
import { Tile } from '@/components/tile'
import type { AttendanceData } from '@/data/dashboard'
import { colors, baseColors } from '@/theme/colors'

interface TeacherAttendanceChartProps {
  data: AttendanceData[]
  isLoading?: boolean
}

/**
 * Calculate the next closest round value for Y-axis max
 */
const calculateRoundMax = (maxValue: number): number => {
  if (maxValue <= 0) return 1000

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const normalized = maxValue / magnitude

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
    return 10 * magnitude * 10
  }

  const nextRound = multiplier * magnitude

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
 * Custom tooltip component
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-2 py-1.5 shadow-sm">
        <p className="text-badge text-heading">
          {`${payload[0].payload.day}: ${payload[0].value.toLocaleString('en-IN')}`}
        </p>
      </div>
    )
  }
  return null
}


/**
 * Custom active bar component that shows label on hover
 */
const CustomActiveBar = (props: any) => {
  const { x, y, width, height, payload } = props
  const radius = 4
  const value = payload?.attendance

  if (height <= 0) return <g />

  // Calculate label width based on value length
  const valueText = value?.toLocaleString('en-IN') || ''
  const labelWidth = Math.max(28, valueText.length * 7 + 8)
  const labelX = x + width / 2 - labelWidth / 2
  const labelY = y - 28 // Position higher to avoid clipping

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={baseColors.pink}
        rx={radius}
        ry={radius}
        opacity={0.8}
      />
      {/* Show label above bar on hover */}
      <rect
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={18}
        fill={baseColors.heading}
        rx={4}
      />
      <text
        x={x + width / 2}
        y={labelY + 13}
        fill={colors.background.card}
        textAnchor="middle"
        fontSize={11}
        fontWeight={fontWeights.medium}
      >
        {valueText}
      </text>
    </g>
  )
}

/**
 * Custom bar shape with rounded corners
 */
const CustomBar = (props: any) => {
  const { x, y, width, height } = props
  const radius = 4

  if (height <= 0) return <g />

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={baseColors.pink}
      rx={radius}
      ry={radius}
    />
  )
}

/**
 * TeacherAttendanceChart - Displays teacher attendance as a combined bar and line chart
 */
export function TeacherAttendanceChart({
  data,
  isLoading = false,
}: TeacherAttendanceChartProps) {
  const [timeRange, setTimeRange] = React.useState('weekly')

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    let filtered: AttendanceData[]
    switch (timeRange) {
      case 'weekly':
        filtered = data.slice(-7)
        break
      case 'last-week':
        filtered = data.slice(-14, -7)
        break
      default:
        filtered = data.slice(-7)
    }

    // Remove Sunday and Saturday from the filtered data (only show weekdays)
    return filtered.filter(item => item.day !== 'Sun' && item.day !== 'Sat')
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
        id="teacher-attendance-chart-tile"
        layoutMode="block"
        style={{ flex: '1 1 0%', minWidth: 0 }}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="h-[260px] w-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Attendance Overview</h3>
            <CardAction>
              <Skeleton className="h-9 w-[110px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-2 flex-1 min-h-0">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="teacher-attendance-chart-tile"
      layoutMode="block"
      style={{ flex: '1 1 0%', minWidth: 0 }}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="h-[260px] w-full pt-4 pb-0 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Attendance Overview</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-2 flex-1 min-h-0">
          <div className="chart-scale h-full">
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={filteredData} margin={{ top: 32, right: 24, bottom: 24, left: 24 }}>
                <CartesianGrid
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
                  width={0}
                  stroke={colors.text.muted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                  domain={[0, yAxisMax]}
                  tickCount={5}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="attendance"
                  shape={CustomBar}
                  fill={baseColors.pink}
                  activeBar={<CustomActiveBar />}
                  barSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke={baseColors.heading}
                  strokeWidth={1.75}
                  dot={{ r: 4, fill: baseColors.heading }}
                  activeDot={{ r: 5, fill: baseColors.heading }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
