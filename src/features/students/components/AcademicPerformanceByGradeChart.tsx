import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { text, border, baseColors, withOpacity } from '@/theme/colors'
import { colors } from '@/theme/colors'
import { ClassPicker } from '@/components/shared/ClassPicker'
import type { AcademicPerformanceEntry } from '@/mocks/students/academic-performance'
import {
  academicPerformanceLastSemester,
  academicPerformanceThisSemester,
} from '@/mocks/students/academic-performance'

type Period = 'last' | 'this'

/**
 * Rotating palette for grade bars — cycles if more than 3 grades are shown.
 * Each entry: [fillColor, strokeCapColor].
 */
const GRADE_PALETTE: [string, string][] = [
  ['var(--accent)', '#9BCFDB'],
  ['var(--heading)', 'var(--heading)'],
  ['var(--primary)', '#E0A0D0'],
]

function getGradeColor(index: number): { fill: string; stroke: string } {
  const [fill, stroke] = GRADE_PALETTE[index % GRADE_PALETTE.length]
  return { fill, stroke }
}

/**
 * Custom tooltip — renders each series row in dark heading text with a small
 * colored dot so the values stay readable (the default Recharts tooltip colors
 * rows with the series fill, which is pastel and invisible on white).
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--heading)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div
          key={entry.name}
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--heading)' }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill }}
            aria-hidden
          />
          <span>Grade {gradeKeyToGrade(String(entry.name))}:</span>
          <span className="font-semibold">{entry.value}%</span>
        </div>
      ))}
    </div>
  )
}

/** Top-stroke cap on each bar matching the AttendanceOverview pattern */
const CustomBarShape = (strokeColor: string) => (props: any) => {
  const { x, y, width, height, fill } = props
  if (height <= 0) return <g />
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={strokeColor} strokeWidth={1.5} />
    </g>
  )
}

/** Extract grade keys from data (keys matching `grade{N}` pattern) */
function extractGradeKeys(data: AcademicPerformanceEntry[]): string[] {
  if (data.length === 0) return []
  const first = data[0]
  return Object.keys(first)
    .filter(k => k.startsWith('grade') && k !== 'month')
    .sort((a, b) => {
      const numA = parseInt(a.replace('grade', ''))
      const numB = parseInt(b.replace('grade', ''))
      return numA - numB
    })
}

/** Convert grade key 'grade7' → grade string '7' */
function gradeKeyToGrade(key: string): string {
  return key.replace('grade', '')
}

/** Convert grade string '7' → grade key 'grade7' */
function gradeToGradeKey(grade: string): string {
  return `grade${grade}`
}

interface Props {
  isLoading?: boolean
}

const MIN_WIDTH_PER_ITEM = 80

export function AcademicPerformanceByGradeChart({ isLoading }: Props) {
  const [period, setPeriod] = React.useState<Period>('last')
  const [selectedGrades, setSelectedGrades] = React.useState<string[]>([])

  const data =
    period === 'last'
      ? academicPerformanceLastSemester
      : academicPerformanceThisSemester

  // All grade keys available in the data
  const allGradeKeys = React.useMemo(() => extractGradeKeys(data), [data])

  // Filter to only the selected grades that exist in data. When the picker
  // returns nothing (empty selection, or stale labels from a previous
  // picker mode), fall back to the first 3 grades so the chart stays
  // readable instead of rendering every admin-configured grade.
  const activeGradeKeys = React.useMemo(() => {
    const picked = selectedGrades
      .map(gradeToGradeKey)
      .filter(k => allGradeKeys.includes(k))
    return picked.length > 0 ? picked : allGradeKeys.slice(0, 3)
  }, [selectedGrades, allGradeKeys])

  const chartMinWidth = data.length * MIN_WIDTH_PER_ITEM
  const needsScroll = chartMinWidth > 300

  if (isLoading) {
    return (
      <Card className="pt-4 pb-2 gap-2">
        <CardHeader>
          <h3 className="text-section-title">Academic Performance</h3>
          <CardAction>
            <Skeleton className="h-9 w-[140px]" />
          </CardAction>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <Skeleton className="h-[170px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group/chart pt-4 pb-0 gap-2">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <h3 className="text-section-title">Academic Performance</h3>
          {/* Dynamic legend */}
          <div style={{ display: 'flex', gap: 16 }}>
            {activeGradeKeys.map((key, idx) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: getGradeColor(idx).fill }} />
                <span style={{ fontSize: 11, color: text.muted }}>Grade {gradeKeyToGrade(key)}</span>
              </div>
            ))}
          </div>
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <div className="opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200">
              <ClassPicker
                storageKey="academic-perf"
                mode="grade"
                max={3}
                onChange={setSelectedGrades}
              />
            </div>
            <Select value={period} onValueChange={(v: string) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last">Last Semester</SelectItem>
                <SelectItem value="this">This Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="px-4 pt-0 pb-0 min-h-0">
        <div className={needsScroll ? 'overflow-x-auto' : ''}>
          <div className="chart-scale" style={needsScroll ? { minWidth: chartMinWidth } : undefined}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={data} barCategoryGap="15%" barGap={2} margin={{ top: 10, right: 0, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={border.subtle} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: text.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 11, fill: text.muted }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                width={36}
              />
              <Tooltip
                cursor={{ fill: withOpacity('var(--accent)', 0.12) }}
                content={<CustomTooltip />}
              />
              {activeGradeKeys.map((key, idx) => {
                const { fill, stroke } = getGradeColor(idx)
                return (
                  <Bar key={key} dataKey={key} fill={fill} shape={CustomBarShape(stroke)} />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
