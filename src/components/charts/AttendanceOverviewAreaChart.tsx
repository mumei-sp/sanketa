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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import type { AttendanceOverviewData } from '@/features/attendance/types'

import { ChartGradient } from '@/theme/ChartGradient'
import { colors } from '@/theme/colors'

interface AttendanceOverviewAreaChartProps {
  data: AttendanceOverviewData[]
  isLoading?: boolean
}

/**
 * Format Y-axis values as percentages
 */
const formatYAxis = (value: number) => {
  return `${value}%`
}

/**
 * Custom tooltip component for attendance overview chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-caption font-medium text-heading mb-1">{data.month}</p>
        <div className="space-y-1">
          <p className="text-caption text-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--primary)' }} />
            Students: <span className="font-medium">{data.students.toFixed(1)}%</span>
          </p>
          <p className="text-caption text-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--accent)' }} />
            Teachers: <span className="font-medium">{data.teachers.toFixed(1)}%</span>
          </p>
          <p className="text-caption text-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--heading)' }} />
            Staff: <span className="font-medium">{data.staff.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

/**
 * Custom Legend Component
 */
const CustomLegend = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--primary)' }} />
        <span className="text-caption text-foreground">Students</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--accent)' }} />
        <span className="text-caption text-foreground">Teachers</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--heading)' }} />
        <span className="text-caption text-foreground">Staff</span>
      </div>
    </div>
  )
}

/**
 * AttendanceOverviewAreaChart - Displays monthly attendance percentages as an area chart
 * with three series: Students, Teachers, and Staff
 */
export function AttendanceOverviewAreaChart({
  data,
  isLoading = false,
}: AttendanceOverviewAreaChartProps) {
  const { terms } = useAcademicDates()
  const termName = terms.length > 0 ? terms[0].label.split(' ')[0] : 'Semester'
  const [timeRange, setTimeRange] = React.useState('last-semester')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-section-title text-heading">Attendance Overview</h3>
          <Skeleton className="h-8 w-[140px]" />
        </div>
        <Skeleton className="h-[204px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* Header with title and dropdown */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-section-title text-heading">Attendance Overview</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-semester">Last {termName}</SelectItem>
            <SelectItem value="this-semester">This {termName}</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0">
        <CustomLegend />
      </div>

      {/* Chart */}
      <div className="chart-scale flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 4, bottom: 0 }}>
            <defs>
              <ChartGradient
                id="studentsGradient"
                color={'var(--primary)'}
                topOpacity={0.4}
                bottomOpacity={0.1}
              />
              <ChartGradient
                id="teachersGradient"
                color={'var(--accent)'}
                topOpacity={0.4}
                bottomOpacity={0.1}
              />
              <ChartGradient
                id="staffGradient"
                color={'var(--heading)'}
                topOpacity={0.4}
                bottomOpacity={0.1}
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
              padding={{ left: 0, right: 0 }}
              stroke={colors.text.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={40}
              stroke={colors.text.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              domain={[0, 100]}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            
            {/* Students Area */}
            <Area
              type="monotone"
              dataKey="students"
              stroke="none"
              fill="url(#studentsGradient)"
              fillOpacity={1}
            />
            
            {/* Teachers Area */}
            <Area
              type="monotone"
              dataKey="teachers"
              stroke="none"
              fill="url(#teachersGradient)"
              fillOpacity={1}
            />
            
            {/* Staff Area */}
            <Area
              type="monotone"
              dataKey="staff"
              stroke="none"
              fill="url(#staffGradient)"
              fillOpacity={1}
            />
            
            {/* Lines on top of areas for better visibility */}
            <Line
              type="monotone"
              dataKey="students"
              stroke={'var(--primary)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary)' }}
            />
            <Line
              type="monotone"
              dataKey="teachers"
              stroke={'var(--accent)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)' }}
            />
            <Line
              type="monotone"
              dataKey="staff"
              stroke={'var(--heading)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--heading)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
