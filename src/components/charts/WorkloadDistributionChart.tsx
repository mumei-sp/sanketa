import * as React from 'react'
import {
  BarChart,
  Bar,
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
import { teacherWorkloadData } from '@/data/mocks/teacher-workload'

interface WorkloadDistributionChartProps {
  isLoading?: boolean
}

/**
 * Format Y-axis values with "h" notation for hours
 */
const formatYAxis = (value: number) => {
  return `${value}h`
}

/**
 * Calculate the next closest round value for Y-axis max
 */
const calculateRoundMax = (maxValue: number): number => {
  if (maxValue <= 0) return 40

  // Round up to next nice number: 10, 20, 30, 40, 50
  if (maxValue <= 10) return 10
  if (maxValue <= 20) return 20
  if (maxValue <= 30) return 30
  if (maxValue <= 40) return 40
  if (maxValue <= 50) return 50

  // For values above 50, round to nearest 10
  return Math.ceil(maxValue / 10) * 10
}

/**
 * Custom tooltip component for workload distribution chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold text-heading mb-1">{data.teacherName}</p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: baseColors.pink }} />
            Total Classes: <span className="font-medium">{data.totalClasses}h</span>
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: baseColors.blue }} />
            Teaching Hours: <span className="font-medium">{data.teachingHours}h</span>
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: baseColors.heading }} />
            Extra Duties: <span className="font-medium">{data.extraDuties}h</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

/**
 * Custom bar shapes with gaps between segments
 */
const GAP_SIZE = 1.5 // Gap size in pixels between segments

const CustomBarBottom = (props: any) => {
  const { x, y, width, height, fill, radius } = props
  if (height <= 0) return <g />
  
  // Reduce height slightly to create gap at top
  const adjustedHeight = height - GAP_SIZE / 2
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={adjustedHeight}
      fill={fill}
      rx={radius[2]}
      ry={radius[3]}
    />
  )
}

const CustomBarMiddle = (props: any) => {
  const { x, y, width, height, fill, radius } = props
  if (height <= 0) return <g />
  
  // Add gap at top and bottom
  const adjustedY = y + GAP_SIZE / 2
  const adjustedHeight = height - GAP_SIZE
  
  return (
    <rect
      x={x}
      y={adjustedY}
      width={width}
      height={adjustedHeight}
      fill={fill}
      rx={radius?.[0] || 4}
      ry={radius?.[1] || 4}
    />
  )
}

const CustomBarTop = (props: any) => {
  const { x, y, width, height, fill, radius } = props
  if (height <= 0) return <g />
  
  // Add gap at bottom, reduce height slightly
  const adjustedY = y + GAP_SIZE / 2
  const adjustedHeight = height - GAP_SIZE / 2
  
  return (
    <rect
      x={x}
      y={adjustedY}
      width={width}
      height={adjustedHeight}
      fill={fill}
      rx={radius[0]}
      ry={radius[1]}
    />
  )
}


/**
 * WorkloadDistributionChart - Displays teacher workload as a stacked bar chart
 */
export function WorkloadDistributionChart({
  isLoading = false,
}: WorkloadDistributionChartProps) {
  const [subject, setSubject] = React.useState('Science')
  const [timePeriod, setTimePeriod] = React.useState('Weekly')

  // Get filtered data based on subject and time period
  const filteredData = React.useMemo(() => {
    const subjectData = teacherWorkloadData[subject]
    if (!subjectData) return []
    return subjectData[timePeriod] || []
  }, [subject, timePeriod])

  // Calculate the rounded max value for Y-axis domain
  const yAxisMax = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 40
    const maxTotal = Math.max(
      ...filteredData.map(d => d.totalClasses + d.teachingHours + d.extraDuties)
    )
    return calculateRoundMax(maxTotal)
  }, [filteredData])

  if (isLoading) {
    return (
      <Tile
        id="workload-distribution-tile"
        layoutMode="flex"
        style={{ flex: '1.33 1 0%', minWidth: 0 }}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="h-[320px] w-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-lg font-semibold">Workload Distribution</h3>
            <CardAction>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[110px]" />
                <Skeleton className="h-9 w-[110px]" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-2 flex-1 min-h-0">
            <div className="chart-scale h-full">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="workload-distribution-tile"
      layoutMode="flex"
      style={{ flex: '1.33 1 0%', minWidth: 0 }}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="h-[260px] w-full pt-4 pb-0 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-lg font-semibold">Workload Distribution</h3>
          <CardAction>
            <div className="flex gap-2">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[110px] bg-[#CDEAF0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[110px] bg-[#CDEAF0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Legend outside chart */}
          <div className="flex-shrink-0 flex items-center gap-6 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColors.pink }} />
              <span className="text-xs text-muted-foreground">Total Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColors.blue }} />
              <span className="text-xs text-muted-foreground">Teaching Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColors.heading }} />
              <span className="text-xs text-muted-foreground">Extra Duties</span>
            </div>
          </div>
          <div className="chart-scale flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
            <div style={{ width: `${Math.max(600, filteredData.length * 70)}px`, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 10, right: 20, left: 4, bottom: 15 }}
                  barCategoryGap={2}
                >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border.default}
                  opacity={0.3}
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="teacherName"
                  padding={{ left: 10, right: 10 }}
                  stroke={colors.text.muted}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={0}
                  textAnchor="middle"
                  height={25}
                  interval={0}
                  tickFormatter={(value) => value.split(' ')[0]}
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
                  dataKey="totalClasses"
                  stackId="workload"
                  fill={baseColors.pink}
                  radius={[0, 0, 4, 4]}
                  barSize={35}
                  shape={CustomBarBottom}
                />
                <Bar
                  dataKey="teachingHours"
                  stackId="workload"
                  fill={baseColors.blue}
                  radius={[4, 4, 4, 4]}
                  barSize={35}
                  shape={CustomBarMiddle}
                />
                <Bar
                  dataKey="extraDuties"
                  stackId="workload"
                  fill={baseColors.heading}
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                  shape={CustomBarTop}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
