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
import {
  academicPerformanceLastSemester,
  academicPerformanceThisSemester,
} from '@/data/mocks/student-academic-performance'

type Period = 'last' | 'this'

const GRADE_COLORS = {
  grade7: '#C0C0C0',
  grade8: baseColors.heading,
  grade9: baseColors.pink,
}

/** Top-stroke cap on each bar matching the AttendanceOverview pattern */
const STROKE_COLORS = {
  grade7: '#999999',
  grade8: baseColors.heading,
  grade9: '#E0A0D0',
}

const CustomBarShape = (dataKey: string) => (props: any) => {
  const { x, y, width, height, fill } = props
  if (height <= 0) return <g />
  const strokeColor = STROKE_COLORS[dataKey as keyof typeof STROKE_COLORS] || fill
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={strokeColor} strokeWidth={1.5} />
    </g>
  )
}

interface Props {
  isLoading?: boolean
}

export function AcademicPerformanceByGradeChart({ isLoading }: Props) {
  const [period, setPeriod] = React.useState<Period>('last')

  const data =
    period === 'last'
      ? academicPerformanceLastSemester
      : academicPerformanceThisSemester

  if (isLoading) {
    return (
      <Card className="pt-4 pb-0 gap-2">
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
    <Card className="pt-4 pb-0 gap-2">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <h3 className="text-section-title">Academic Performance</h3>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { key: 'grade7', label: 'Grade 7' },
              { key: 'grade8', label: 'Grade 8' },
              { key: 'grade9', label: 'Grade 9' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: GRADE_COLORS[key as keyof typeof GRADE_COLORS] }} />
                <span style={{ fontSize: 11, color: text.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <CardAction>
          <Select value={period} onValueChange={(v: string) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px] bg-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last">Last Semester</SelectItem>
              <SelectItem value="this">This Semester</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-4 pt-0 pb-2">
        <div className="chart-scale">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data} barCategoryGap="15%" barGap={0} margin={{ top: 10, right: 0, left: 4, bottom: 8 }}>
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
                cursor={{ fill: withOpacity(baseColors.blue, 0.12) }}
                contentStyle={{
                  background: colors.background.card,
                  border: `1px solid ${border.default}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: text.heading,
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'grade7' ? 'Grade 7' : name === 'grade8' ? 'Grade 8' : 'Grade 9',
                ]}
              />
              <Bar dataKey="grade7" fill={GRADE_COLORS.grade7} shape={CustomBarShape('grade7')} />
              <Bar dataKey="grade8" fill={GRADE_COLORS.grade8} shape={CustomBarShape('grade8')} />
              <Bar dataKey="grade9" fill={GRADE_COLORS.grade9} shape={CustomBarShape('grade9')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
