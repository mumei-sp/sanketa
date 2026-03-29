import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'
import { baseColors } from '@/theme/colors'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExpenseBreakdownData } from '../types'

interface ExpenseBreakdownChartProps {
  data: ExpenseBreakdownData[]
  total: number
  isLoading?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  Salaries: baseColors.heading,
  Supplies: baseColors.pink,
  Maintenance: baseColors.blue,
  Events: '#A5D6A7',
  Others: '#E0E0E0',
}

export function ExpenseBreakdownChart({
  data,
  total,
  isLoading = false,
}: ExpenseBreakdownChartProps) {
  if (isLoading) {
    return (
      <Tile
        id="expense-breakdown-tile"
        layoutMode="block"
        background="transparent"
        padding={0}
        shadowed={false}
        className="h-full"
      >
        <Card className="h-full w-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Expense Breakdown</h3>
            <CardAction>
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-6 pt-2 pb-4 flex-1 min-h-0">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="expense-breakdown-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
      className="h-full"
    >
      <Card className="h-full w-full pt-4 pb-0 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Expense Breakdown</h3>
          <CardAction>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-6 pt-2 pb-4 flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row items-center gap-4 h-full">
            {/* Donut chart */}
            <div className="relative flex-shrink-0 w-[160px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="amount"
                    strokeWidth={2}
                    stroke="#fff"
                    isAnimationActive={false}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || '#E0E0E0'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Total Expense</span>
                <span className="text-lg font-bold" style={{ color: baseColors.heading }}>
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1 min-w-0">
              {data.map(item => (
                <div key={item.category} className="flex items-start gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#E0E0E0' }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground block truncate">{item.category}</span>
                    <span className="text-xs font-medium" style={{ color: baseColors.heading }}>
                      ₹{(item.amount / 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}K
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
