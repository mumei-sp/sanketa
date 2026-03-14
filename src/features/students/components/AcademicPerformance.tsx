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
import { colors } from '@/theme/colors'

export interface MonthlyPerformance {
  month: string
  score: number
}

export interface AcademicPerformanceProps {
  averageScore: number // Score out of 100
  monthlyData?: MonthlyPerformance[]
  studentName?: string
  isLoading?: boolean
  tileWidth?: ResponsiveValue<number>
  tileLayoutMode?: 'grid' | 'block'
}

/**
 * Generate mock monthly performance data if not provided
 */
function generateMonthlyData(baseScore: number): MonthlyPerformance[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const variation = 5 // Allow ±5 points variation
  const data: MonthlyPerformance[] = []

  for (let i = 0; i < months.length; i++) {
    // Create a slight upward trend with some variation
    const trend = (i / months.length) * 2 // Small upward trend
    const randomVariation = (Math.random() - 0.5) * variation
    const score = Math.max(0, Math.min(100, baseScore + trend + randomVariation))
    data.push({
      month: months[i],
      score: Math.round(score),
    })
  }

  return data
}

/**
 * Custom tooltip for bar chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-2 py-1.5 shadow-sm dark:bg-gray-800">
        <p className="text-badge text-heading">{`${payload[0].value}%`}</p>
      </div>
    )
  }
  return null
}

/**
 * Custom bar component with rounded top corners
 */
const CustomBar = (props: any) => {
  const { x, y, width, height } = props
  // Use light pink color for bars (matching the theme)
  const fillColor = colors.primary.base

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fillColor} rx={4} ry={4} />
    </g>
  )
}

/**
 * Custom label component to show score above bars
 */
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      fill={colors.text.heading}
      textAnchor="middle"
      fontSize={11}
      fontWeight={fontWeights.semibold}
    >
      {value}
    </text>
  )
}

/**
 * Semi-circular gauge chart component
 */
function GaugeChart({ value, maxValue = 100 }: { value: number; maxValue?: number }) {
  const size = 220 // Horizontal span of the gauge
  const strokeWidth = 24 // Arc thickness for better visibility
  // Use larger radius for a proper semi-circle (approximately half the width minus padding)
  const radius = (size - strokeWidth) * 0.48 // Creates a proper semi-circle arc
  const circumference = Math.PI * radius // Half circle circumference

  // Normalize value to 0-100
  const normalizedValue = Math.max(0, Math.min(100, (value / maxValue) * 100))
  const percentage = normalizedValue / 100

  // Calculate arc length for filled portion
  const arcLength = circumference * percentage

  // Colors: dark blue for filled, light pink for unfilled
  const filledColor = colors.text.heading // Dark blue (heading color)
  const unfilledColor = colors.primary.base // Light pink

  // Start and end points for the semi-circle (from left to right, bottom)
  // The arc sits at the bottom of the gauge
  const centerX = size / 2
  const arcBottomY = size * 0.52 // Position arc near bottom for proper semi-circle appearance
  const startX = strokeWidth / 2
  const startY = arcBottomY
  const endX = size - strokeWidth / 2
  const endY = arcBottomY

  // Calculate text position - center it in the space above the arc
  const textCenterX = centerX
  // The center of the semi-circle space (where text should be positioned)
  // Arc top is at (arcBottomY - radius), so center is halfway between top and bottom
  const arcTopY = arcBottomY - radius
  const textY = arcTopY + radius * 0.5 // Center of the semi-circle space
  const labelY = textY + 20 // Position label below score with proper spacing

  // SVG height to accommodate the full semi-circle
  const svgHeight = arcBottomY + strokeWidth / 2 + 8 // Extra space for stroke and padding

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={svgHeight}
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* Background arc (unfilled) - semi-circle from left to right */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={unfilledColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Filled arc - drawn with dasharray to show percentage */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={filledColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0"
        />
        {/* Score text - positioned in center of semi-circle space */}
        <text
          x={textCenterX}
          y={textY}
          textAnchor="middle"
          fontSize={28}
          fontWeight={fontWeights.bold}
          fill={colors.text.heading}
          dominantBaseline="middle"
        >
          {value.toFixed(1)}/100
        </text>
        {/* Subtitle text - directly below score */}
        <text
          x={textCenterX}
          y={labelY}
          textAnchor="middle"
          fontSize={11}
          fill={colors.text.muted}
          dominantBaseline="middle"
        >
          Average Score
        </text>
      </svg>
    </div>
  )
}

/**
 * Academic Performance component
 * Displays gauge chart, motivational message, and monthly performance bar chart
 * Matches the structure and dimensions of other chart components
 */
export function AcademicPerformance({
  averageScore,
  monthlyData,
  studentName = 'Student',
  isLoading = false,
  tileWidth,
  tileLayoutMode = 'block',
}: AcademicPerformanceProps) {
  const [timePeriod, setTimePeriod] = React.useState('6months')
  const data = monthlyData || generateMonthlyData(averageScore)

  // Filter data based on selected time period
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    switch (timePeriod) {
      case '3months':
        return data.slice(-3)
      case '6months':
        return data.slice(-6)
      case '12months':
        // If we have less than 12 months, return all available
        return data
      default:
        return data.slice(-6)
    }
  }, [data, timePeriod])

  // Generate motivational message based on score
  const getMotivationalMessage = (score: number): string => {
    if (score >= 90) {
      return `${studentName} shows consistent excellence in studies and leadership in group projects. Keep aiming high!`
    } else if (score >= 80) {
      return `${studentName} demonstrates strong academic performance. Continue to build on this foundation!`
    } else if (score >= 70) {
      return `${studentName} is making good progress. Keep up the effort and focus on areas for improvement!`
    } else {
      return `${studentName} has room for growth. With dedication and support, improvement is within reach!`
    }
  }

  if (isLoading) {
    return (
      <Tile
        id="academic-performance-tile"
        layoutMode={tileLayoutMode}
        width={tileWidth}
        background="transparent"
        padding={0}
        shadowed={false}
      >
        <Card className="pt-6 pb-0">
          <CardHeader>
            <h3 className="text-section-title">Academic Performance</h3>
            <CardAction>
              <Skeleton className="h-9 w-[140px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <Skeleton className="h-[204px] w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="academic-performance-tile"
      layoutMode={tileLayoutMode}
      width={tileWidth}
      background="transparent"
      padding={0}
      shadowed={false}
    >
      <Card className="pt-6 pb-0">
        <CardHeader>
          <h3 className="text-section-title">Academic Performance</h3>
          <CardAction>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[140px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          <div className="chart-scale">
            <div className="grid grid-cols-2 gap-8" style={{ height: '220px' }}>
              {/* Left side: Gauge Chart */}
              <div className="flex flex-col items-center justify-center">
                <GaugeChart value={averageScore} />
                <p className="mt-8 text-xs text-muted-foreground text-left max-w-[200px] leading-relaxed">
                  {getMotivationalMessage(averageScore)}
                </p>
              </div>

              {/* Right side: Bar Chart */}
              <div className="flex flex-col">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={filteredData}
                    margin={{ top: 24, right: 0, left: 4, bottom: 12 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border.default}
                      opacity={0.12}
                      vertical={false}
                      horizontal={true}
                    />
                    <XAxis
                      dataKey="month"
                      padding={{ left: 0, right: 0 }}
                      stroke={colors.text.muted}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      width={36}
                      stroke={colors.text.muted}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickCount={6}
                      hide={true}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="score" shape={CustomBar} activeBar={false} barSize={32}>
                      <LabelList content={<CustomLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}

