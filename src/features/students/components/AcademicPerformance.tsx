/**
 * Academic Performance card: gauge (average score), motivational text, and monthly score bar chart.
 * Comments explain what each block does and, where we changed behavior, why the old approach was
 * removed or updated and why the new one was added (e.g. 12 months data, responsive gauge, thinner bars).
 */
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
import { Tile } from '@/components/tile'
import { colors } from '@/theme/colors'
import { useIsMobile } from '@/hooks/use-mobile'

/** One month's score for the bar chart. month = label (e.g. "Jan"), score = 0–100. */
export interface MonthlyPerformance {
  month: string
  score: number
}

/**
 * Props for the Academic Performance card.
 * averageScore drives the gauge and fallback mock data; monthlyData overrides mock when provided.
 */
export interface AcademicPerformanceProps {
  averageScore: number // Score out of 100; used for gauge and for generateMonthlyData when monthlyData is absent
  monthlyData?: MonthlyPerformance[] // If provided, used as-is; otherwise generateMonthlyData(averageScore) is used
  studentName?: string // Used in motivational message text
  isLoading?: boolean // When true, shows skeleton instead of charts
  tileWidth?: number // Grid column span when inside a TileWrapper (e.g. 6 for half width)
  tileLayoutMode?: 'grid' | 'block' // How the Tile lays out (grid = span columns, block = flow)
}

/**
 * Generate mock monthly performance data if not provided.
 * Why 12 months: Previously only 6 months (Jan–Jun) were generated, so "Last 12 Months" showed
 * only 6 bars. We now generate 12 months (Jan–Dec) so all three dropdown options have correct data.
 */
function generateMonthlyData(baseScore: number): MonthlyPerformance[] {
  // Full 12 months so "Last 12 Months" filter can show a full year; kept from previous fix.
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const variation = 5 // Allow ±5 points variation per month so scores look realistic
  const data: MonthlyPerformance[] = []

  for (let i = 0; i < months.length; i++) {
    // Create a slight upward trend with some variation (original logic kept)
    const trend = (i / months.length) * 2 // Small upward trend over the year
    const randomVariation = (Math.random() - 0.5) * variation // Random ±variation
    const score = Math.max(0, Math.min(100, baseScore + trend + randomVariation)) // Clamp to 0–100
    data.push({
      month: months[i],
      score: Math.round(score),
    })
  }

  return data
}

/**
 * Custom tooltip for bar chart. Shows the bar's score value when hovering.
 * active = tooltip is visible; payload = array of series data (we use first item's value).
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
 * Custom bar component with rounded top corners. Recharts passes x, y, width, height from the chart layout.
 */
const CustomBar = (props: any) => {
  const { x, y, width, height } = props // Recharts-provided position and size in SVG space
  // Use light pink color for bars (matching the theme); original comment kept.
  const fillColor = colors.primary.base

  return (
    <g>
      {/* rx/ry=4 gives rounded corners; keeps bars visually consistent with design */}
      <rect x={x} y={y} width={width} height={height} fill={fillColor} rx={4} ry={4} />
    </g>
  )
}

/**
 * Custom label component to show score above each bar. Recharts passes x, y, width, value.
 */
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props
  return (
    <text
      x={x + width / 2}   // Center text horizontally on the bar
      y={y - 4}           // Place slightly above the bar top so it doesn't overlap
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
 * Semi-circular gauge chart. Why changed from old implementation: previously the gauge used
 * fixed pixel size (220) and strokeWidth 24, which (1) didn't scale with page size and (2) caused
 * the score text to overlap the arc. New: fixed viewBox so SVG scales with container; stroke 16 so
 * text has clear space; text positioned lower (0.62 of radius) so it sits inside the bowl and doesn't overlap.
 */
const GAUGE_VIEWBOX_WIDTH = 200 // Design-time width; actual size comes from CSS (width: 100%)

function GaugeChart({ value, maxValue = 100 }: { value: number; maxValue?: number }) {
  const size = GAUGE_VIEWBOX_WIDTH
  // Thinner arc (16 not 24): so score text has clear space and doesn't overlap the blue bar; original overlap fix.
  const strokeWidth = 16
  const radius = (size - strokeWidth) * 0.48 // Semi-circle radius; 0.48 keeps arc within viewBox
  const circumference = Math.PI * radius // Half circle length for dasharray calculation

  const normalizedValue = Math.max(0, Math.min(100, (value / maxValue) * 100))
  const percentage = normalizedValue / 100
  const arcLength = circumference * percentage // Filled portion length for strokeDasharray

  const filledColor = colors.text.heading   // Dark blue for the filled part
  const unfilledColor = colors.primary.base // Light pink for the unfilled part

  const centerX = size / 2
  const arcBottomY = size * 0.52  // Y position of the flat bottom of the semi-circle
  const startX = strokeWidth / 2  // Arc start (left end)
  const startY = arcBottomY
  const endX = size - strokeWidth / 2
  const endY = arcBottomY

  const textCenterX = centerX
  const arcTopY = arcBottomY - radius // Top of the arc (curved part)
  // Position score well inside the semicircle (0.62 = lower than center 0.5) so it doesn't overlap the arc; why: old 0.5 caused overlap.
  const textY = arcTopY + radius * 0.62
  const labelY = textY + size * 0.11 // "Average Score" label below the score number

  const svgHeight = Math.round(arcBottomY + strokeWidth / 2 + 8) // Enough height for arc + padding

  const scoreFontSize = 22  // Fixed size in viewBox units; scales with SVG
  const labelFontSize = 11

  return (
    // Wrapper: allows gauge to scale with parent width; min-w-0 prevents flex/grid overflow on small screens.
    <div className="flex flex-col items-center w-full min-w-0 max-w-full">
      {/* No fixed width/height: viewBox + w-full h-auto makes gauge responsive to container (and thus page size). */}
      <svg
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', minHeight: 0 }}
      >
        {/* Background arc (unfilled) - semi-circle from left to right; original comment kept. */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={unfilledColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Filled arc - same path, strokeDasharray shows only first arcLength; rest is gap. Original comment kept. */}
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
        {/* Score text - positioned in center of semi-circle space; original comment kept. */}
        <text
          x={textCenterX}
          y={textY}
          textAnchor="middle"
          fontSize={scoreFontSize}
          fontWeight={fontWeights.bold}
          fill={colors.text.heading}
          dominantBaseline="middle"
        >
          {value.toFixed(1)}/100
        </text>
        {/* Subtitle text - directly below score; original comment kept. */}
        <text
          x={textCenterX}
          y={labelY}
          textAnchor="middle"
          fontSize={labelFontSize}
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
  const isMobile = useIsMobile() // Used for bar width and barCategoryGap so chart fits narrow screens
  const [timePeriod, setTimePeriod] = React.useState('6months') // Dropdown: 3months | 6months | 12months
  const data = monthlyData || generateMonthlyData(averageScore) // Use prop if provided, else 12-month mock
  // Thinner bars on mobile (12px) so they don't dominate; 18px on desktop. Why: old fixed 32px was too chunky.
  const barWidth = isMobile ? 12 : 18

  /**
   * Filter data by selected time period. slice(-n) = last n months (most recent).
   * Why 12months uses slice(-12): previously we returned `data` as-is; but data was only 6 months so
   * "Last 12 Months" still showed 6. Now data has 12 months and we return data.slice(-12) so all 12 show.
   */
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    switch (timePeriod) {
      case '3months':
        return data.slice(-3)   // Last 3 (e.g. Oct, Nov, Dec when data has 12 months)
      case '6months':
        return data.slice(-6)   // Last 6 (e.g. Jul–Dec)
      case '12months':
        return data.slice(-12)  // Last 12 = all months when data has 12; if fewer, returns all available
      default:
        return data.slice(-6)
    }
  }, [data, timePeriod])

  // Generate motivational message based on score; original comment kept.
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

  // Loading state: show skeleton in same layout as real content so no layout shift.
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
              <Skeleton className="h-9 w-[140px]" /> {/* Placeholder for time-period dropdown */}
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <Skeleton className="h-[204px] w-full" /> {/* Placeholder for gauge + chart area */}
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
            {/* Time range dropdown; value drives filteredData (3/6/12 months). */}
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
        {/* px-4 on mobile, px-6 from sm up: tighter padding on small screens to use space better. */}
        <CardContent className="px-4 sm:px-6 pt-0 pb-4">
          <div className="chart-scale">
            {/* Row and gap scale with viewport (clamp) so layout stays proportional on all page sizes; not fixed px. */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(1rem,2.5vw,2rem)] md:gap-[clamp(1.25rem,3vw,2rem)] items-stretch"
              style={{ minHeight: 'clamp(200px, 28vw, 320px)' }}
            >
              {/* Left column: Gauge + motivational text. Full width on mobile (grid-cols-1), half on md+. */}
              <div className="flex flex-col items-center justify-center min-w-0 w-full">
                {/* max-w-[min(100%,26vw)]: gauge grows with viewport up to 26vw so it's not tiny on big screens. */}
                <div className="w-full max-w-[min(100%,26vw)]">
                  <GaugeChart value={averageScore} />
                </div>
                {/* Margin below gauge uses clamp(0.75rem, 2vw, 1.5rem) so spacing scales with viewport. */}
                <p className="mt-[clamp(0.75rem,2vw,1.5rem)] text-xs text-muted-foreground text-left max-w-[200px] leading-relaxed">
                  {getMotivationalMessage(averageScore)}
                </p>
              </div>

              {/* Right column: Bar chart. Horizontal scroll when 12 months so bars stay readable (each bar gets min width). */}
              <div
                className="flex flex-col min-w-0 overflow-x-auto overflow-y-hidden"
                style={{ height: 'clamp(180px, 24vw, 280px)' }}
              >
                {/* Inner wrapper: min-width so 12 bars have enough space; scroll container above allows horizontal slide. */}
                <div
                  className="h-full shrink-0"
                  style={{
                    minWidth: `${Math.max(filteredData.length * 48, 200)}px`,
                    width: filteredData.length > 6 ? `${filteredData.length * 48}px` : '100%',
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredData}
                      margin={{ top: 24, right: 8, left: 4, bottom: 12 }}
                      barCategoryGap={isMobile ? '25%' : '40%'}
                      barGap={4}
                    >
                    {/* Horizontal grid lines only; vertical=false avoids clutter. */}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border.default}
                      opacity={0.12}
                      vertical={false}
                      horizontal={true}
                    />
                    {/* Month labels; padding 4 so first/last labels don't get clipped. */}
                    <XAxis
                      dataKey="month"
                      padding={{ left: 4, right: 4 }}
                      stroke={colors.text.muted}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    {/* Y axis hidden but domain [0,100] still sets scale for bar heights. */}
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
                    {/* barSize=barWidth (12 mobile, 18 desktop) so bars are thinner than old fixed 32. */}
                    <Bar dataKey="score" shape={CustomBar} activeBar={false} barSize={barWidth}>
                      <LabelList content={<CustomLabel />} />
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}

