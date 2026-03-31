import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { text, background, border, baseColors, withOpacity } from '@/theme/colors'
import {
  academicPerformanceLastSemester,
  academicPerformanceThisSemester,
} from '@/data/mocks/student-academic-performance'

type Period = 'last' | 'this'

const GRADE_COLORS = {
  grade7: baseColors.heading,
  grade8: '#3B82B0',
  grade9: baseColors.blue,
}

const FILTER_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Last Semester', value: 'last' },
  { label: 'This Semester', value: 'this' },
]

interface Props {
  isLoading?: boolean
}

export function AcademicPerformanceByGradeChart({ isLoading }: Props) {
  const [period, setPeriod] = React.useState<Period>('last')

  const data =
    period === 'last'
      ? academicPerformanceLastSemester
      : academicPerformanceThisSemester

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: text.heading }}>
          Academic Performance
        </span>
        <div style={{ display: 'flex', gap: 4, background: background.surface, borderRadius: 8, padding: '3px' }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: period === opt.value ? background.card : 'transparent',
                color: period === opt.value ? text.heading : text.muted,
                boxShadow: period === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexShrink: 0 }}>
        {[
          { key: 'grade7', label: 'Grade 7' },
          { key: 'grade8', label: 'Grade 8' },
          { key: 'grade9', label: 'Grade 9' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: GRADE_COLORS[key as keyof typeof GRADE_COLORS] }} />
            <span style={{ fontSize: 11, color: text.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <Skeleton className="flex-1 w-full rounded" style={{ minHeight: 160 }} />
      ) : (
        <div style={{ flex: 1, minHeight: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%" barGap={3}>
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
                ticks={[0, 20, 40, 60, 80, 100]}
              />
              <Tooltip
                cursor={{ fill: withOpacity(baseColors.blue, 0.12) }}
                contentStyle={{
                  background: background.card,
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
              <Bar dataKey="grade7" fill={GRADE_COLORS.grade7} radius={[3, 3, 0, 0]} />
              <Bar dataKey="grade8" fill={GRADE_COLORS.grade8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="grade9" fill={GRADE_COLORS.grade9} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
