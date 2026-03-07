import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { baseColors } from '@/theme/colors'
import type { DepartmentData } from '@/data/mocks/teacher-statistics'

interface DepartmentChartProps {
  data: DepartmentData[]
  total: number
  isLoading?: boolean
}

const DEPARTMENT_COLORS: Record<string, string> = {
  Science: baseColors.heading,
  Mathematics: baseColors.pink,
  Language: baseColors.blue,
  Social: '#A5D6A7',
  Arts: '#FFB74D',
  'Physical Education': '#E0E0E0',
}

export function DepartmentChart({
  data,
  total,
  isLoading = false,
}: DepartmentChartProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-xs p-4 h-full flex flex-col">
        <h3 className="text-section-title text-heading mb-3">Department</h3>
        <Skeleton className="h-full w-full flex-1" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-xs p-4 h-full flex flex-col">
      <h3 className="text-section-title text-heading mb-3">Department</h3>

      <div className="flex-1 min-h-0 flex flex-col items-center gap-4">
        {/* Donut chart with center label */}
        <div className="relative w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any[]}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                dataKey="count"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={DEPARTMENT_COLORS[entry.name] || '#E0E0E0'}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground">Total Teachers</span>
            <span className="text-xl font-bold" style={{ color: baseColors.heading }}>
              {total}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex flex-col gap-2">
          {data.map(item => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: DEPARTMENT_COLORS[item.name] || '#E0E0E0' }}
                />
                <span className="text-xs text-muted-foreground truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold" style={{ color: baseColors.heading }}>
                  {item.count}
                </span>
                <span className="text-[11px] text-muted-foreground w-8 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
