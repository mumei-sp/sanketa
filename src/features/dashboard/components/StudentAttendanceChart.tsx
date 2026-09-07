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
import { Tile } from '@/components/tile'
import { colors } from '@/theme/colors'
import { useBrandColors } from '@/hooks/use-brand-colors'
import { ChartGradient } from '@/theme/ChartGradient'
import type { AttendanceDataset } from '../types'

interface StudentAttendanceChartProps {
  datasets: AttendanceDataset[]
  isLoading?: boolean
}

const MIN_WIDTH_PER_ITEM = 70

const RoundedBar = (props: any) => {
  const { x, y, width, height } = props
  if (!height || height <= 0) return <g />
  return <rect x={x} y={y} width={width} height={height} fill="url(#attendanceBarGradient)" rx={3} ry={3} />
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>
          {data.day}
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--heading)' }}>
          {data.count.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export function StudentAttendanceChart({ datasets, isLoading = false }: StudentAttendanceChartProps) {
  const [selected, setSelected] = React.useState('')

  React.useEffect(() => {
    if (datasets.length > 0 && !selected) {
      setSelected(datasets[0].value)
    }
  }, [datasets, selected])

  const activeDataset = datasets.find(d => d.value === selected) ?? datasets[0]
  const data = activeDataset?.data ?? []
  const brand = useBrandColors()
  const chartMinWidth = data.length * MIN_WIDTH_PER_ITEM
  const needsScroll = chartMinWidth > 300

  if (isLoading || !activeDataset) {
    return (
      <Tile id="student-attendance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="w-full h-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Student Attendance</h3>
            <CardAction><Skeleton className="h-9 w-[100px]" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1"><Skeleton className="h-[180px] w-full" /></CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="student-attendance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
      <Card className="w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Student Attendance</h3>
          <CardAction>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-[100px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(ds => (
                  <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0">
          <div className={`h-full ${needsScroll ? 'overflow-x-auto' : ''}`}>
            <div className="chart-scale h-full" style={needsScroll ? { minWidth: chartMinWidth } : undefined}>
              <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <ChartGradient id="attendanceBarGradient" color={brand.primary} topOpacity={0.9} bottomOpacity={0.4} />
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.default} opacity={0.3} vertical={false} />
                  <XAxis dataKey="day" stroke={colors.text.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    width={40}
                    stroke={colors.text.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickCount={5}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar
                    dataKey="count"
                    fill="url(#attendanceBarGradient)"
                    shape={RoundedBar}
                    isAnimationActive={false}
                    barSize={32}
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
